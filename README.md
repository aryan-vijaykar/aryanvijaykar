# Aryan Vijaykar — Portfolio Identity Proxy

A lightweight HTTP reverse proxy (Node.js + Python fallback) that serves a portfolio site with live browser-side identity patching. No framework. No npm dependencies beyond Node itself.

---

## How it works

1. The proxy forwards every request to an upstream portfolio site (`UPSTREAM_ORIGIN`)
2. For HTML responses, it injects `identity-patch.js` into the page before `</head>`
3. That script runs in the browser, walks the DOM, and replaces all upstream content with Aryan's details — text, links, metadata, SVG hero name, JSON-LD, and images

The upstream site uses Next.js with length-prefixed React flight payloads in its HTML. Rewriting text server-side breaks hydration. Patching in the browser after render keeps everything intact.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/aryan-vijaykar/aryanvijaykar.git
cd aryanvijaykar
```

### 2. Create a `.env` file

```bash
cp .env.example .env
```

Edit `.env` and set your upstream URL:

```
UPSTREAM_ORIGIN=https://your-upstream-site.com
```

### 3. Run with Node.js

```bash
npm start
```

Or pass the env var inline (no `.env` file needed):

```bash
UPSTREAM_ORIGIN=https://your-upstream-site.com npm start
```

### 4. Open in browser

```
http://localhost:3000
```

---

## Run with Python (no Node.js required)

```bash
UPSTREAM_ORIGIN=https://your-upstream-site.com python server.py
```

Python 3.9+ required. Uses only the standard library.

---

## Project structure

| File | Purpose |
|---|---|
| `server.js` | Node.js proxy server (primary) |
| `server.py` | Python proxy server (fallback) |
| `identity-patch.js` | Browser-side DOM patcher injected into every HTML response |
| `index.html` | Local launcher page (open via the proxy at `http://localhost:3000`) |
| `package.json` | npm scripts |
| `.env.example` | Environment variable template |
| `assets/` | Local placeholder images served instead of upstream name-bearing photos |
| `style.css` / `clean.css` / `motion.css` | Local stylesheet overrides |

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `UPSTREAM_ORIGIN` | ✅ Yes | — | Full URL of the upstream site (e.g. `https://example.com`) |
| `PORT` | No | `3000` | Local port to listen on |

---

## Deployment

This project requires a **persistent Node.js or Python process** with outbound HTTPS access. Static hosts (S3, GitHub Pages, Netlify) will not work.

**Recommended platforms:**

| Platform | Steps |
|---|---|
| **Railway** | Connect GitHub repo → set `UPSTREAM_ORIGIN` env var → deploy |
| **Render** | Connect GitHub repo → set `UPSTREAM_ORIGIN` env var → deploy |
| **Fly.io** | `fly launch` → set secret: `fly secrets set UPSTREAM_ORIGIN=https://...` |
| **Any VPS / EC2** | SSH in → `UPSTREAM_ORIGIN=https://... npm start` |

---

## Author

**Aryan Vijaykar** — Developer Relations @ Single Core Labs · AWS Student Builder Group Leader · Community Organizer in Nagpur, India

- GitHub: [github.com/aryan-vijaykar](https://github.com/aryan-vijaykar)
- LinkedIn: [linkedin.com/in/aryan-vijaykar](https://linkedin.com/in/aryan-vijaykar)
