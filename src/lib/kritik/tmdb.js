const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function searchMovies(query) {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not set");
    return [];
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=de-DE`,
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) {
      throw new Error(`TMDB API Error: ${res.statusText}`);
    }

    const data = await res.json();

    return data.results.slice(0, 10).map((movie) => ({
      externalId: `tmdb-${movie.id}`,
      title: movie.title,
      description: movie.overview,
      image: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      releaseDate: movie.release_date,
      type: "movie",
    }));
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return [];
  }
}
