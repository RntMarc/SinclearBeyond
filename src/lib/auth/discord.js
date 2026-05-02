import sharp from "sharp";

export async function getDiscordAuthUrl(mode = "login", callbackUrl = null) {
  const state = callbackUrl ? `${mode}|${callbackUrl}` : mode;

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email guilds",
    state: state,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
  });

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("Discord token exchange error:", error);
    throw new Error("Failed to exchange code for tokens");
  }

  return await res.json();
}

export async function getDiscordUser(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Discord user");
  }

  return await res.json();
}

export async function getDiscordUserGuilds(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Discord guilds");
  }

  return await res.json();
}

export async function processDiscordAvatar(userId, avatarHash) {
  if (!avatarHash) return null;

  const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=512`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const processedBuffer = await sharp(Buffer.from(buffer))
    .resize(265, 265)
    .jpeg({ quality: 70 })
    .toBuffer();

  return `data:image/jpeg;base64,${processedBuffer.toString("base64")}`;
}
