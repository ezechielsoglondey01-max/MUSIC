const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, index: true },
    sourceId: { type: String, required: true, index: true },

    name: { type: String, required: true, index: true },
    artistName: { type: String, required: true, index: true },
    releaseDate: { type: Date },

    artworkUrl100: { type: String },
    url: { type: String },
    genres: { type: [String], default: [] }
  },
  { timestamps: true }
);

TrackSchema.index({ source: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model("Track", TrackSchema);

