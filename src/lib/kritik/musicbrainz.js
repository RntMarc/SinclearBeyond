const MUSICBRAINZ_BASE_URL = "https://musicbrainz.org/ws/2";

export async function searchMusic(query) {
  try {
    const res = await fetch(
      `${MUSICBRAINZ_BASE_URL}/release-group?query=${encodeURIComponent(query)}&fmt=json`,
      {
        headers: {
          "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )",
        },
        next: { revalidate: 86400 },
      },
    );

    if (!res.ok) {
      throw new Error(`MusicBrainz API Error: ${res.statusText}`);
    }

    const data = await res.json();

    return data["release-groups"].slice(0, 10).map((rg) => ({
      externalId: `mb-${rg.id}`,
      title: `${rg["artist-credit"]?.[0]?.name} - ${rg.title}`,
      description: rg["primary-type"] || "Album",
      image: rg.id
        ? `https://coverartarchive.org/release-group/${rg.id}/front-500`
        : null,
      releaseDate: rg["first-release-date"],
      type: "music",
    }));
  } catch (error) {
    console.error("MusicBrainz Search Error:", error);
    return [];
  }
}
