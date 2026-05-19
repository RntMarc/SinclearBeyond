import { fetchWithTimeout } from "@/lib/utils";

const MUSICBRAINZ_BASE_URL = "https://musicbrainz.org/ws/2";

export async function searchMusic(query) {
  try {
    // Search for both release groups (albums) and recordings (songs)
    const [rgRes, recRes] = await Promise.all([
      fetchWithTimeout(
        `${MUSICBRAINZ_BASE_URL}/release-group?query=${encodeURIComponent(query)}&fmt=json`,
        {
          headers: {
            "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )",
          },
          next: { revalidate: 86400 },
        },
        10000,
      ),
      fetchWithTimeout(
        `${MUSICBRAINZ_BASE_URL}/recording?query=${encodeURIComponent(query)}&fmt=json`,
        {
          headers: {
            "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )",
          },
          next: { revalidate: 86400 },
        },
        10000,
      ),
    ]);

    const rgData = rgRes.ok ? await rgRes.json() : { "release-groups": [] };
    const recData = recRes.ok ? await recRes.json() : { recordings: [] };

    const albums = rgData["release-groups"].slice(0, 5).map((rg) => ({
      externalId: `mb-rg-${rg.id}`,
      title: `${rg["artist-credit"]?.[0]?.name} - ${rg.title}`,
      description: rg["primary-type"] || "Album",
      image: rg.id
        ? `https://coverartarchive.org/release-group/${rg.id}/front-500`
        : null,
      releaseDate: rg["first-release-date"],
      type: "music",
      format: "album",
    }));

    const songs = recData.recordings.slice(0, 5).map((rec) => ({
      externalId: `mb-rec-${rec.id}`,
      title: `${rec["artist-credit"]?.[0]?.name} - ${rec.title}`,
      description: "Song",
      image: rec.releases?.[0]?.id
        ? `https://coverartarchive.org/release/${rec.releases[0].id}/front-500`
        : null,
      releaseDate: rec.releases?.[0]?.date,
      type: "music",
      format: "song",
    }));

    return [...albums, ...songs];
  } catch (error) {
    console.error("MusicBrainz Search Error:", error);
    return [];
  }
}

export async function getMusicDetails(mbId, format) {
  try {
    const id = mbId.replace("mb-rg-", "").replace("mb-rec-", "");
    const entity = format === "album" ? "release-group" : "recording";
    const res = await fetchWithTimeout(
      `${MUSICBRAINZ_BASE_URL}/${entity}/${id}?inc=url-rels+artist-credits${format === "song" ? "+releases" : ""}&fmt=json`,
      {
        headers: { "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )" },
      },
      10000,
    );
    if (!res.ok) throw new Error(`Failed to fetch ${entity} details`);
    const data = await res.json();

    const links = (data.relations || [])
      .filter((rel) => rel["target-type"] === "url")
      .map((rel) => ({
        type: rel.type,
        url: rel.url.resource,
      }));

    return {
      title: `${data["artist-credit"]?.[0]?.name} - ${data.title}`,
      description: format === "album" ? data["primary-type"] : "Song",
      image:
        format === "album"
          ? `https://coverartarchive.org/release-group/${data.id}/front-500`
          : data.releases?.[0]?.id
            ? `https://coverartarchive.org/release/${data.releases[0].id}/front-500`
            : null,
      releaseDate:
        format === "album"
          ? data["first-release-date"]
          : data.releases?.[0]?.date,
      links,
    };
  } catch (error) {
    console.error("MusicBrainz Details Error:", error);
    return null;
  }
}

export async function getAlbumTracks(mbReleaseGroupId) {
  try {
    const rgId = mbReleaseGroupId.replace("mb-rg-", "");
    // First get releases for this release group
    const res = await fetchWithTimeout(
      `${MUSICBRAINZ_BASE_URL}/release-group/${rgId}?inc=releases&fmt=json`,
      {
        headers: { "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )" },
      },
      10000,
    );
    if (!res.ok) throw new Error("Failed to fetch release group");
    const data = await res.json();

    // Use the first release to get tracks
    const releaseId = data.releases?.[0]?.id;
    if (!releaseId) return [];

    const relRes = await fetchWithTimeout(
      `${MUSICBRAINZ_BASE_URL}/release/${releaseId}?inc=recordings+artist-credits&fmt=json`,
      {
        headers: { "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )" },
      },
      10000,
    );
    if (!relRes.ok) throw new Error("Failed to fetch release");
    const relData = await relRes.json();

    const tracks = [];
    for (const medium of relData.media || []) {
      for (const track of medium.tracks || []) {
        tracks.push({
          songExternalId: `mb-rec-${track.recording.id}`,
          title: track.title,
          trackNumber: track.position,
          artist: track["artist-credit"]?.[0]?.name,
          releaseDate: relData.date,
        });
      }
    }
    return tracks;
  } catch (error) {
    console.error("MusicBrainz Tracks Error:", error);
    return [];
  }
}

export async function getSongAlbums(mbRecordingId) {
  try {
    const recId = mbRecordingId.replace("mb-rec-", "");
    const res = await fetchWithTimeout(
      `${MUSICBRAINZ_BASE_URL}/recording/${recId}?inc=releases+release-groups&fmt=json`,
      {
        headers: { "User-Agent": "SinclearBeyond/0.1.0 ( admin@sinclear.de )" },
      },
      10000,
    );
    if (!res.ok) throw new Error("Failed to fetch recording");
    const data = await res.json();

    return (data.releases || []).map((rel) => ({
      albumExternalId: `mb-rg-${rel["release-group"]?.id}`,
      title: rel.title,
      image: `https://coverartarchive.org/release/${rel.id}/front-500`,
    }));
  } catch (error) {
    console.error("MusicBrainz Song Albums Error:", error);
    return [];
  }
}
