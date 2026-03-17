const DEFAULT_API_URL =
  "https://rss.marketingtools.apple.com/api/v2/fr/music/most-played/10/albums.json";

async function fetchAppleMostPlayedAlbums(apiUrl = DEFAULT_API_URL) {
  const res = await fetch(apiUrl, {
    headers: {
      "accept": "application/json"
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apple API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const results = data?.feed?.results;
  if (!Array.isArray(results)) return [];

  return results.map((item) => ({
    source: "apple_rss",
    sourceId: String(item?.id ?? ""),
    name: item?.name ?? "Sans titre",
    artistName: item?.artistName ?? "Inconnu",
    releaseDate: item?.releaseDate ? new Date(item.releaseDate) : null,
    artworkUrl100: item?.artworkUrl100 ?? null,
    url: item?.url ?? null,
    genres: Array.isArray(item?.genres) ? item.genres.map((g) => g?.name).filter(Boolean) : []
  }));
}

module.exports = {
  DEFAULT_API_URL,
  fetchAppleMostPlayedAlbums
};

