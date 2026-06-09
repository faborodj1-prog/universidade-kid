require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const trailRoutes = require("./routes/trails");
const progressRoutes = require("./routes/progress");
const visitRoutes = require("./routes/visits");
const uploadRoutes = require("./routes/uploads");
const gamificationRoutes = require("./routes/gamification");
const certificateRoutes = require("./routes/certificates");
const reportsRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? false
    : ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use("/api/", limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use("/api/auth/", authLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", ts: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/trails", trailRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/reports", reportsRoutes);

// Serve frontend em produção
const staticPath = path.join(__dirname, "../../../", process.env.STATIC_PATH || "packages/web/dist");
app.use(express.static(staticPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Universidade Kid API rodando na porta ${PORT}`);
});
