const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;

// The upstream portfolio site. Override via UPSTREAM_ORIGIN env var.
const REMOTE_ORIGIN = (process.env.UPSTREAM_ORIGIN || '').replace(/\/$/, '');
if (!REMOTE_ORIGIN) {
  console.error('UPSTREAM_ORIGIN env var is required (e.g. https://example.com)');
  process.exit(1);
}

const IDENTITY_PATCH_PATH = path.join(__dirname, 'identity-patch.js');
// Read per request so edits apply without a restart.
const readIdentityPatch = () => fs.readFileSync(IDENTITY_PATCH_PATH);
const UPSTREAM_AGENT = new https.Agent({ keepAlive: true, maxSockets: 6 });

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function replaceStatusNearTitle(html, title, status) {
  const pattern = new RegExp(`(${escapeRegExp(title)}[\\s\\S]{0,2500}?)Expires May 2027`, 'g');
  return html.replace(pattern, `$1${status}`);
}

/**
 * Attach the identity layer without editing upstream markup.
 *
 * The document carries a length-prefixed React flight payload (for example
 * `4:T413,`). Rewriting any served text shifts those offsets, hydration fails,
 * and the page freezes on the preloader. So the HTML is passed through and only
 * a script tag is appended; the data swap happens in the browser.
 */
function patchHtml(source, localOrigin) {
  const html = source.split(REMOTE_ORIGIN).join(localOrigin);
  if (html.includes('/__identity_patch.js')) return html;

  const scriptTag = '<script src="/__identity_patch.js"></script>';
  if (html.includes('</head>')) return html.replace('</head>', `${scriptTag}</head>`);
  if (html.includes('</body>')) return html.replace('</body>', `${scriptTag}</body>`);
  return `${html}${scriptTag}`;
}

function localOriginFor(request) {
  const forwarded = request.headers['x-forwarded-proto'];
  const protocol = forwarded ? String(forwarded).split(',')[0].trim() : 'http';
  return `${protocol}://${request.headers.host || `localhost:${PORT}`}`;
}

function proxyRequest(request, response) {
  if (/cloudleadership\.webp/i.test(request.url || '')) {
    const placeholder = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">' +
      '<rect width="900" height="1200" fill="#d4d4d4"/>' +
      '<rect x="40" y="40" width="820" height="1120" fill="none" stroke="#9a9a9a" stroke-width="4" stroke-dasharray="18 14"/>' +
      '<text x="450" y="590" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="bold" fill="#6f6f6f">PHOTO</text>' +
      '<text x="450" y="655" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" fill="#8a8a8a">COMING SOON</text>' +
      '</svg>'
    );
    response.writeHead(200, {
      'content-type': 'image/svg+xml; charset=utf-8',
      'content-length': placeholder.length,
      'cache-control': 'no-store'
    });
    if (request.method === 'HEAD') response.end();
    else response.end(placeholder);
    return;
  }

  if (request.url === '/__identity_patch.js') {
    const patch = readIdentityPatch();
    response.writeHead(200, {
      'content-type': 'application/javascript; charset=utf-8',
      'content-length': patch.length,
      'cache-control': 'no-store'
    });
    if (request.method === 'HEAD') response.end();
    else response.end(patch);
    return;
  }

  if (request.url === '/api/health') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ ok: true, mode: 'identity-proxy' }));
    return;
  }

  const target = new URL(request.url || '/', REMOTE_ORIGIN);
  const headers = { ...request.headers, host: target.host, 'accept-encoding': 'identity' };
  delete headers.connection;

  if (headers.origin) headers.origin = REMOTE_ORIGIN;
  if (headers.referer) headers.referer = String(headers.referer).replace(localOriginFor(request), REMOTE_ORIGIN);

  const retryable = request.method === 'GET' || request.method === 'HEAD';
  const makeUpstreamRequest = (attempt = 0) => {
    const upstream = https.request(target, {
      method: request.method,
      headers,
      agent: UPSTREAM_AGENT
    }, (upstreamResponse) => {
      const chunks = [];
      upstreamResponse.on('data', (chunk) => chunks.push(chunk));
      upstreamResponse.on('end', () => {
        const originalBody = Buffer.concat(chunks);
        if (retryable && [502, 503, 504].includes(upstreamResponse.statusCode) && attempt < 3) {
          setTimeout(() => makeUpstreamRequest(attempt + 1), 200 * (2 ** attempt));
          return;
        }

        const contentType = String(upstreamResponse.headers['content-type'] || '');
        const isHtml = contentType.includes('text/html');
        const body = isHtml
          ? Buffer.from(patchHtml(originalBody.toString('utf8'), localOriginFor(request)), 'utf8')
          : originalBody;

        const outgoingHeaders = { ...upstreamResponse.headers };
        delete outgoingHeaders['content-length'];
        delete outgoingHeaders['content-encoding'];
        delete outgoingHeaders['transfer-encoding'];
        delete outgoingHeaders['content-security-policy'];
        delete outgoingHeaders['content-security-policy-report-only'];
        delete outgoingHeaders['x-frame-options'];
        outgoingHeaders['content-length'] = body.length;
        if (isHtml) outgoingHeaders['cache-control'] = 'no-store';

        if (outgoingHeaders.location) {
          outgoingHeaders.location = String(outgoingHeaders.location).replace(REMOTE_ORIGIN, localOriginFor(request));
        }

        response.writeHead(upstreamResponse.statusCode || 502, outgoingHeaders);
        if (request.method === 'HEAD') response.end();
        else response.end(body);
      });
    });

    upstream.on('error', (error) => {
      if (retryable && attempt < 3) {
        setTimeout(() => makeUpstreamRequest(attempt + 1), 200 * (2 ** attempt));
        return;
      }
      if (response.headersSent) return response.destroy(error);
      response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Unable to load the portfolio source', detail: error.message }));
    });

    if (retryable) upstream.end();
    else request.pipe(upstream);
  };

  makeUpstreamRequest();
}

// Bind both loopback families: `localhost` resolves to ::1 first on Windows,
// so an IPv4-only listener makes the browser report a refused connection.
const listen = (host, label) => {
  const server = http.createServer(proxyRequest);
  server.on('error', (error) => {
    if (['EAFNOSUPPORT', 'EADDRNOTAVAIL', 'EINVAL'].includes(error.code)) {
      console.log(`${label} unavailable (${error.code})`);
      return;
    }
    throw error;
  });
  server.listen(PORT, host, () => console.log(`http://${label}:${PORT}`));
};

listen('127.0.0.1', '127.0.0.1');
listen('::1', 'localhost');
console.log('Portfolio identity proxy active for Aryan Vijaykar');
