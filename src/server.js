require("dotenv").config();

const express = require("express");
const path = require("path");
const Track = require("./models/Track");
const { connectDb } = require("./db");
const { syncFromApple } = require("./services/sync");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public")));

function mustHaveAdminToken(req) {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) return true;
  const header = req.headers["x-admin-token"];
  const token = typeof header === "string" ? header : "";
  return token && token === configured;
}

app.get("/healthz", async (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(48, Math.max(6, Number.parseInt(String(req.query.pageSize ?? "12"), 10) || 12));

  const filter = q
    ? {
        $or: [
          { name: { $regex: escapeRegex(q), $options: "i" } },
          { artistName: { $regex: escapeRegex(q), $options: "i" } }
        ]
      }
    : {};

  const [total, tracks] = await Promise.all([
    Track.countDocuments(filter),
    Track.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean()
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.render("index", {
    title: "Music Browser",
    tracks,
    q,
    page,
    pageSize,
    total,
    totalPages
  });
});

app.get("/tracks/:id", async (req, res) => {
  const track = await Track.findById(req.params.id).lean();
  if (!track) return res.status(404).send("Not found");

  res.render("track", {
    title: `${track.name} — ${track.artistName}`,
    track
  });
});

app.get("/api/tracks", async (req, res) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(200, Math.max(1, Number.parseInt(String(req.query.pageSize ?? "20"), 10) || 20));
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const filter = q
    ? {
        $or: [
          { name: { $regex: escapeRegex(q), $options: "i" } },
          { artistName: { $regex: escapeRegex(q), $options: "i" } }
        ]
      }
    : {};

  const [total, items] = await Promise.all([
    Track.countDocuments(filter),
    Track.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean()
  ]);

  res.json({ page, pageSize, total, items });
});

app.get("/api/tracks/:id", async (req, res) => {
  const item = await Track.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: "not_found" });
  res.json(item);
});

app.post("/admin/sync", async (req, res) => {
  if (!mustHaveAdminToken(req)) return res.status(401).json({ error: "unauthorized" });
  const summary = await syncFromApple();
  res.json({ ok: true, ...summary });
});

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  await connectDb();

  if (String(process.env.SYNC_ON_START ?? "").toLowerCase() === "true") {
    try {
      await syncFromApple();
    } catch (e) {
      console.error("SYNC_ON_START failed:", e?.message || e);
    }
  }

  const port = Number.parseInt(process.env.PORT || "8080", 10);
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

