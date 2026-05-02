# Sinclear Beyond

Sinclear Beyond ist eine umfassende Webanwendung zur Verwaltung von Reisen, Terminen und sozialen Interaktionen. Es wurde primär für den privaten Gebrauch entwickelt, kann aber von jedem geforkt und angepasst werden.

## Funktionen

- ✈️ **Reiseverwaltung:** Plane Trips, verwalte Unterkünfte und behalte den Überblick über Teilnehmer und Tickets.
- 📅 **Kalender:** Ein kombinierter Kalender für Events, Reisen und Geburtstage.
- 📱 **Social Feed:** Teile Musik, Videos, News und andere Inhalte mit deinen Kontakten.
- 🔒 **Sicherheit:** Moderne Authentifizierung mittels Passkeys (WebAuthn), E-Mail OTP oder Discord OAuth.
- 👥 **Kontakte:** Verwalte enge Kontakte und teile spezifische Informationen basierend auf Sichtbarkeitseinstellungen.
- 🛠️ **Admin-Bereich:** Zentrale Verwaltung für Reisen, Nutzer und Webhooks.
- 🖼️ **Integrationen:** Fotovorschau via Unsplash-API.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Datenbank:** MySQL mit Drizzle ORM
- **Styling:** Tailwind CSS & Shadcn/UI
- **Icons:** Lucide React

## Installation

### Voraussetzungen

- Node.js (v18 oder neuer)
- Ein MySQL-Datenbankserver
- Ein SMTP-Server für den E-Mail-Versand (OTP)

### Setup

1. Klone das Repository:
   ```bash
   git clone https://github.com/dein-nutzer/sinclear-beyond.git
   cd sinclear-beyond
   ```

2. Installiere die Abhängigkeiten:
   ```bash
   pnpm install
   # oder
   npm install
   ```

3. Erstelle eine `.env` Datei basierend auf der `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fülle die entsprechenden Werte in der `.env` aus.

Folgende Umgebungsvariablen werden für Discord OAuth benötigt:
- `DISCORD_CLIENT_ID`: Deine Discord Client ID
- `DISCORD_CLIENT_SECRET`: Dein Discord Client Secret
- `DISCORD_REDIRECT_URI`: Deine Callback URL (z.B. `http://localhost:3000/api/auth/discord/callback`)
- `DISCORD_ALLOWED_GUILD_ID`: Die ID des Discord-Servers, auf dem Nutzer sein müssen, um sich zu registrieren.

### Datenbank

Die Datenbank wird mit Drizzle ORM verwaltet. Um das Schema zu pushen:

```bash
pnpm drizzle-kit push
```

Weitere Informationen findest du in der [Drizzle Dokumentation](https://orm.drizzle.team/).

### Entwicklungsserver starten

```bash
pnpm dev
```

Die Anwendung ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Docker

Das Projekt kann auch mit Docker betrieben werden:

1. Erstelle das Docker-Image:
   ```bash
   docker build -t sinclear-beyond .
   ```

2. Starte den Container:
   ```bash
   docker run -p 3000:3000 --env-file .env sinclear-beyond
   ```

## Lizenz

Privat / Open Source (bitte Lizenzdatei falls vorhanden prüfen).
