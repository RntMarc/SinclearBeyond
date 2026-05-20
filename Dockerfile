# Stage 1: Install & Build
FROM node:lts-alpine AS builder
WORKDIR /app

# Corepack aktivieren, um pnpm bereitzustellen
RUN corepack enable pnpm

# pnpm-lock.yaml statt package-lock.json verwenden
COPY package.json pnpm-lock.yaml* ./
# --frozen-lockfile ist das pnpm-Äquivalent zu npm ci
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
# pnpm run build statt npx next build
RUN pnpm run build

# Stage 2: Run
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Wir kopieren NUR die produktionsrelevanten Dateien aus der Stage 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Berechtigungen für den 'node' User setzen
RUN chown -R node:node /app/.next

# Sicherheit: Nicht als Root ausführen
USER node

EXPOSE 3000
# npx ist Teil von Node und funktioniert hier weiterhin wunderbar, 
# um das lokale next aus den node_modules zu starten.
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
