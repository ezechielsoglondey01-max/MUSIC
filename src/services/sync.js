const Track = require("../models/Track");
const { fetchAppleMostPlayedAlbums } = require("./appleMusic");

async function upsertTracks(tracks) {
  let inserted = 0;
  let updated = 0;

  for (const t of tracks) {
    if (!t?.source || !t?.sourceId) continue;
    const res = await Track.updateOne(
      { source: t.source, sourceId: t.sourceId },
      {
        $set: {
          name: t.name,
          artistName: t.artistName,
          releaseDate: t.releaseDate,
          artworkUrl100: t.artworkUrl100,
          url: t.url,
          genres: t.genres
        }
      },
      { upsert: true }
    );

    if (res.upsertedCount) inserted += res.upsertedCount;
    if (res.matchedCount && res.modifiedCount) updated += res.modifiedCount;
  }

  return { inserted, updated, total: tracks.length };
}

async function syncFromApple() {
  const tracks = await fetchAppleMostPlayedAlbums(process.env.APPLE_API_URL);
  const summary = await upsertTracks(tracks);
  return { source: "apple_rss", ...summary };
}

module.exports = { syncFromApple };

