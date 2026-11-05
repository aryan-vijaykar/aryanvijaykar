"""Python fallback for the dependency-free identity proxy.

Use `python server.py` when Node.js is unavailable. The production entry point
remains server.js; both servers preserve the upstream layout and assets.
"""

from __future__ import annotations

import http.client
import os
import re
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

PORT = int(os.environ.get("PORT", "3000"))

# The upstream portfolio site. Override via UPSTREAM_ORIGIN env var.
_upstream_origin = os.environ.get("UPSTREAM_ORIGIN", "").rstrip("/")
if not _upstream_origin:
    raise SystemExit("UPSTREAM_ORIGIN env var is required (e.g. https://example.com)")
REMOTE_ORIGIN = _upstream_origin
REMOTE_HOST = _upstream_origin.removeprefix("https://").removeprefix("http://")

IDENTITY_PATCH_PATH = Path(__file__).with_name("identity-patch.js")


def read_identity_patch() -> bytes:
    """Read from disk per request so edits apply without a restart."""
    return IDENTITY_PATCH_PATH.read_bytes()


UPSTREAM_LIMIT = threading.BoundedSemaphore(6)


def replace_status_near_title(html: str, title: str, status: str) -> str:
    pattern = re.compile(f"({re.escape(title)}[\\s\\S]{{0,2500}}?)Expires May 2027")
    return pattern.sub(lambda match: f"{match.group(1)}{status}", html)


def patch_html(source: str, local_origin: str) -> str:
    """Attach the identity layer without editing upstream markup.

    The document carries a length-prefixed React flight payload (for example
    ``4:T413,``). Rewriting any served text shifts those offsets, hydration
    fails, and the page freezes on the preloader. So the HTML is passed through
    and only a script tag is appended; the data swap happens in the browser.
    """
    html = source.replace(REMOTE_ORIGIN, local_origin)
    if "/__identity_patch.js" in html:
        return html

    script_tag = '<script src="/__identity_patch.js"></script>'
    if "</head>" in html:
        return html.replace("</head>", f"{script_tag}</head>", 1)
    if "</body>" in html:
        return html.replace("</body>", f"{script_tag}</body>", 1)
    return f"{html}{script_tag}"


class IdentityProxyHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    @property
    def local_origin(self) -> str:
        protocol = self.headers.get("X-Forwarded-Proto", "http").split(",", 1)[0].strip()
        return f"{protocol}://{self.headers.get('Host', f'localhost:{PORT}')}"

    def do_GET(self) -> None:  # noqa: N802
        self._proxy()

    def do_HEAD(self) -> None:  # noqa: N802
        self._proxy()

    def do_POST(self) -> None:  # noqa: N802
        self._proxy()

    def do_PUT(self) -> None:  # noqa: N802
        self._proxy()

    def do_PATCH(self) -> None:  # noqa: N802
        self._proxy()

    def do_DELETE(self) -> None:  # noqa: N802
        self._proxy()

    def _proxy(self) -> None:
        if "cloudleadership.webp" in self.path.lower():
            placeholder = (
                b'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">'
                b'<rect width="900" height="1200" fill="#d4d4d4"/>'
                b'<rect x="40" y="40" width="820" height="1120" fill="none" stroke="#9a9a9a" stroke-width="4" stroke-dasharray="18 14"/>'
                b'<text x="450" y="590" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="bold" fill="#6f6f6f">PHOTO</text>'
                b'<text x="450" y="655" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" fill="#8a8a8a">COMING SOON</text>'
                b'</svg>'
            )
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
            self.send_header("Content-Length", str(len(placeholder)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(placeholder)
            return

        if self.path == "/__identity_patch.js":
            patch = read_identity_patch()
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(patch)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(patch)
            return

        if self.path == "/api/health":
            payload = b'{"ok":true,"mode":"identity-proxy","runtime":"python"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)
            return

        request_headers = {key: value for key, value in self.headers.items()}
        request_headers["Host"] = REMOTE_HOST
        request_headers["Accept-Encoding"] = "identity"
        request_headers.pop("Connection", None)
        if "Origin" in request_headers:
            request_headers["Origin"] = REMOTE_ORIGIN
        if "Referer" in request_headers:
            request_headers["Referer"] = request_headers["Referer"].replace(self.local_origin, REMOTE_ORIGIN)

        length = int(self.headers.get("Content-Length", "0"))
        request_body = self.rfile.read(length) if length else None
        target_path = urlsplit(self.path).path or "/"
        if urlsplit(self.path).query:
            target_path += f"?{urlsplit(self.path).query}"

        connection = None
        try:
            for attempt in range(4):
                connection = http.client.HTTPSConnection(REMOTE_HOST, timeout=30)
                with UPSTREAM_LIMIT:
                    connection.request(self.command, target_path, body=request_body, headers=request_headers)
                    upstream = connection.getresponse()
                    original_body = upstream.read()
                if upstream.status not in {502, 503, 504} or self.command not in {"GET", "HEAD"} or attempt == 3:
                    break
                connection.close()
                connection = None
                time.sleep(0.2 * (2**attempt))

            content_type = upstream.getheader("Content-Type", "")
            is_html = "text/html" in content_type
            response_body = (
                patch_html(original_body.decode("utf-8"), self.local_origin).encode("utf-8")
                if is_html
                else original_body
            )

            self.send_response(upstream.status)
            blocked_headers = {
                "content-length",
                "content-encoding",
                "transfer-encoding",
                "content-security-policy",
                "content-security-policy-report-only",
                "x-frame-options",
                "connection",
            }
            for key, value in upstream.getheaders():
                if key.lower() in blocked_headers:
                    continue
                if key.lower() == "location":
                    value = value.replace(REMOTE_ORIGIN, self.local_origin)
                if is_html and key.lower() == "cache-control":
                    continue
                self.send_header(key, value)
            self.send_header("Content-Length", str(len(response_body)))
            if is_html:
                self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(response_body)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            return
        except Exception as error:  # pragma: no cover - runtime network failure path
            payload = f'{{"error":"Unable to load the portfolio source","detail":{error!r}}}'.encode()
            try:
                self.send_response(502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                return
        finally:
            if connection is not None:
                connection.close()

    def log_message(self, format_string: str, *args: object) -> None:
        print(f"{self.address_string()} - {format_string % args}")


class IPv6ThreadingHTTPServer(ThreadingHTTPServer):
    """Loopback IPv6 listener: on Windows `localhost` resolves to ::1 first."""

    address_family = socket.AF_INET6


def serve_loopback() -> None:
    servers = [ThreadingHTTPServer(("127.0.0.1", PORT), IdentityProxyHandler)]
    try:
        servers.append(IPv6ThreadingHTTPServer(("::1", PORT), IdentityProxyHandler))
    except OSError as error:  # pragma: no cover - host without IPv6 loopback
        print(f"IPv6 loopback unavailable, serving IPv4 only ({error})")

    print(f"http://localhost:{PORT}")
    print(f"http://127.0.0.1:{PORT}")
    print("Portfolio identity proxy active for Aryan Vijaykar")

    for server in servers:
        threading.Thread(target=server.serve_forever, daemon=True).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        for server in servers:
            server.shutdown()


if __name__ == "__main__":
    serve_loopback()
