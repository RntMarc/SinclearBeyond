# --- Stage 1: Build ---
FROM node:lts-alpine AS builder

# Corepack aktivieren, um pnpm verfügbar zu machen
RUN corepack enable pnpm

WORKDIR /app

# Nur die Abhängigkeits-Dateien kopieren (für besseres Docker Caching)
COPY package.json pnpm-lock.yaml ./

# Abhängigkeiten installieren (--frozen-lockfile verhindert Änderungen an der Lock-Datei)
RUN pnpm install --frozen-lockfile

# Restlichen Code kopieren und bauen
COPY . .
RUN pnpm build

# --- Stage 2: Production ---
FROM node:lts-alpine AS runner

RUN corepack enable pnpm

WORKDIR /app

# Nur die gebauten Dateien und Produktions-Abhängigkeiten aus der Builder-Stage übernehmen
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
# (Falls du node_modules kopieren willst statt neu zu installieren, passe diesen Schritt an)

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

# App starten
CMD ["pnpm", "start"]
