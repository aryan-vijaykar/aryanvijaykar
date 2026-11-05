# ── build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Copy only the files the server needs (no node_modules — zero npm dependencies).
COPY package.json ./
COPY server.js ./
COPY identity-patch.js ./
COPY index.html ./
COPY style.css clean.css motion.css script.js ./
COPY assets/ ./assets/

# ── runtime ────────────────────────────────────────────────────────────────────
# Re-use the same image — nothing to compile.
FROM base AS runtime

# Runs as non-root user for security (AWS ECS best practice).
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# PORT and UPSTREAM_ORIGIN are supplied at runtime via environment variables.
# Do NOT bake UPSTREAM_ORIGIN into the image.
ENV PORT=3000
EXPOSE 3000

# Healthcheck used by ECS and App Runner to determine container readiness.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
