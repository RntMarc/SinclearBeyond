# Stage 1: Install & Build
FROM node:lts-alpine AS builder
WORKDIR /app

# Wir brauchen ALLE dependencies für den Build (auch devDeps)
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Next.js braucht oft schärfere Umgebungsvariablen beim Build
ENV NODE_ENV=production
RUN npx next build

# Stage 2: Run
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Wir kopieren NUR die produktionsrelevanten Dateien aus der Stage 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Sicherheit: Nicht als Root ausführen
USER node

EXPOSE 3000
CMD ["npx", "next", "start"]
