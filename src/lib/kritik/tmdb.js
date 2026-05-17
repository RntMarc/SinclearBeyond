const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function searchMovies(query) {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not set");
    return [];
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=de-DE`,
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) {
      throw new Error(`TMDB API Error: ${res.statusText}`);
    }

    const data = await res.json();

    return data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 10)
      .map((item) => ({
        externalId: `tmdb-${item.id}`,
        title: item.media_type === "movie" ? item.title : item.name,
        description: item.overview,
        image: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        releaseDate:
          item.media_type === "movie" ? item.release_date : item.first_air_date,
        type: "movie",
        format: item.media_type === "movie" ? "movie" : "series",
      }));
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return [];
  }
}

export async function getSeriesEpisodes(tmdbId) {
  if (!TMDB_API_KEY) return [];

  try {
    const seriesId = tmdbId.replace("tmdb-", "");
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}?api_key=${TMDB_API_KEY}&language=de-DE`,
    );
    if (!res.ok) throw new Error("Failed to fetch series details");
    const seriesData = await res.json();

    const allEpisodes = [];
    const seasonPromises = seriesData.seasons
      .filter((s) => s.season_number > 0)
      .map((season) =>
        fetch(
          `${TMDB_BASE_URL}/tv/${seriesId}/season/${season.season_number}?api_key=${TMDB_API_KEY}&language=de-DE`,
        ).then((res) => (res.ok ? res.json() : null)),
      );

    const seasonsData = await Promise.all(seasonPromises);

    for (const seasonData of seasonsData) {
      if (seasonData) {
        for (const episode of seasonData.episodes) {
          allEpisodes.push({
            seasonNumber: episode.season_number,
            episodeNumber: episode.episode_number,
            title: episode.name,
            externalId: `tmdb-ep-${episode.id}`,
            releaseDate: episode.air_date,
          });
        }
      }
    }
    return allEpisodes;
  } catch (error) {
    console.error("TMDB Episodes Error:", error);
    return [];
  }
}
