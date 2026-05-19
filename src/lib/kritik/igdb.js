import apicalypse from "apicalypse";

let accessToken = null;
let tokenExpires = 0;

import { fetchWithTimeout } from "@/lib/utils";

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpires) {
    return accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET not set");
    return null;
  }

  try {
    const response = await fetchWithTimeout(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST" },
      10000,
    );

    if (!response.ok) {
      throw new Error(`Failed to get Twitch token: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpires = Date.now() + data.expires_in * 1000 - 60000; // 1 minute buffer
    return accessToken;
  } catch (error) {
    console.error("Error fetching Twitch access token:", error);
    return null;
  }
}

export async function searchGames(query) {
  const token = await getAccessToken();
  if (!token) return [];

  const clientId = process.env.TWITCH_CLIENT_ID;

  try {
    const requestOptions = {
      method: "POST",
      baseURL: "https://api.igdb.com/v4",
      headers: {
        Accept: "application/json",
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await apicalypse(requestOptions)
      .fields(["name", "summary", "cover.url", "first_release_date"])
      .search(query)
      .limit(10)
      .request("/games");

    return response.data.map((game) => ({
      externalId: `igdb-${game.id}`,
      title: game.name,
      description: game.summary,
      image: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_720p")}`
        : null,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      type: "game",
    }));
  } catch (error) {
    console.error("IGDB Search Error:", error);
    return [];
  }
}

export async function getGameDetails(externalId) {
  const token = await getAccessToken();
  if (!token) return null;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const gameId = externalId.replace("igdb-", "");

  try {
    const requestOptions = {
      method: "POST",
      baseURL: "https://api.igdb.com/v4",
      headers: {
        Accept: "application/json",
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await apicalypse(requestOptions)
      .fields([
        "name",
        "summary",
        "cover.url",
        "first_release_date",
        "websites.url",
        "websites.category",
      ])
      .where(`id = ${gameId}`)
      .request("/games");

    if (!response.data || response.data.length === 0) return null;
    const game = response.data[0];

    const links = (game.websites || []).map((w) => ({
      type: "website",
      url: w.url,
      category: w.category,
    }));

    return {
      title: game.name,
      description: game.summary,
      image: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_720p")}`
        : null,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      links,
    };
  } catch (error) {
    console.error("IGDB Details Error:", error);
    return null;
  }
}
