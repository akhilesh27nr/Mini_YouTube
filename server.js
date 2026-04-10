const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

let bcrypt;
try {
  bcrypt = require("bcrypt");
  console.log("✓ bcrypt loaded");
} catch (e) {
  console.warn("⚠️  bcrypt not found. Run: npm install bcrypt");
  bcrypt = null;
}

let jwt;
try {
  jwt = require("jsonwebtoken");
  console.log("✓ jsonwebtoken loaded");
} catch (e) {
  console.warn("⚠️  jsonwebtoken not found.");
  jwt = null;
}

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "youtube_clone_jwt_secret_key_2024";
const JWT_EXPIRES_IN = "7d";

app.use(express.json());
app.use(express.static(__dirname));

// ============ IMAGE PROXY ============
app.get("/api/avatar", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url param");
  const allowed = ["yt3.googleusercontent.com", "yt3.ggpht.com", "lh3.googleusercontent.com"];
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch (e) { return res.status(400).send("Invalid url"); }
  if (!allowed.some(host => parsedUrl.hostname.endsWith(host))) return res.status(403).send("Host not allowed");
  const lib = parsedUrl.protocol === "https:" ? https : http;
  lib.get({
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    headers: { "Referer": "https://www.youtube.com/", "User-Agent": "Mozilla/5.0" }
  }, (proxyRes) => {
    res.setHeader("Content-Type", proxyRes.headers["content-type"] || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    proxyRes.pipe(res);
  }).on("error", () => res.status(502).send("Proxy error"));
});

// ============ JSON PERSISTENCE ============
function readJSON(filename, defaultValue = []) {
  try {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) { return defaultValue; }
}

function writeJSON(filename, data) {
  try {
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) { return false; }
}

// ============ HELPERS ============
async function hashPassword(password) {
  if (bcrypt) return await bcrypt.hash(password, SALT_ROUNDS);
  return password;
}

async function comparePassword(plain, hashed) {
  if (bcrypt) {
    if (hashed.startsWith("$2b$") || hashed.startsWith("$2a$")) return await bcrypt.compare(plain, hashed);
    return plain === hashed;
  }
  return plain === hashed;
}

function generateToken(user) {
  if (!jwt) return null;
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  if (!jwt) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch (e) { return null; }
}

function sanitizeUser(user) {
  const { password: _, ...safe } = user;
  return safe;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============ OPTIONAL AUTH MIDDLEWARE ============
// Used only on routes that truly need it (login/register return token).
// Subscription, settings, comments work WITHOUT a token so the existing
// frontend (which does not implement JWT login) keeps working.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid or expired token" });
  req.user = decoded;
  next();
}

// ============ VIDEO ROUTES ============
app.get("/api/videos", (req, res) => {
  try { res.json(readJSON("videos.json", [])); }
  catch (e) { res.status(500).json({ error: "Failed to load videos" }); }
});

app.get("/api/videos/:id", (req, res) => {
  try {
    const video = readJSON("videos.json", []).find(v => v.id === parseInt(req.params.id));
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  } catch (e) { res.status(500).json({ error: "Failed to load video" }); }
});

// ============ MUSIC ROUTE ============
app.get("/api/music", (req, res) => {
  try { res.json(readJSON("music.json", [])); }
  catch (e) { res.status(500).json({ error: "Failed to load music" }); }
});

// ============ AUTH ROUTES ============
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "All fields are required" });
  if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });

  const users = readJSON("users.json", []);
  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(400).json({ error: "Email already registered" });
  }

  try {
    const newUser = {
      id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      settings: { notificationsEnabled: true, darkMode: false, commentsEnabled: true, profilePrivacy: "public" },
      subscriptions: [],
    };
    users.push(newUser);
    writeJSON("users.json", users);
    res.status(201).json({
      message: "Registration successful",
      token: generateToken(newUser),
      user: sanitizeUser(newUser)
    });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email format" });

  const users = readJSON("users.json", []);
  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  try {
    if (!await comparePassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ message: "Login successful", token: generateToken(user), user: sanitizeUser(user) });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/refresh", authMiddleware, (req, res) => {
  const user = readJSON("users.json", []).find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ token: generateToken(user), user: sanitizeUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ============ USER ROUTES (no auth required — frontend uses userId from state) ============
app.get("/api/users/:id", (req, res) => {
  const user = readJSON("users.json", []).find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(sanitizeUser(user));
});

app.put("/api/users/:id/settings", (req, res) => {
  const userId = parseInt(req.params.id);
  const { notificationsEnabled, darkMode, commentsEnabled, profilePrivacy, name, email } = req.body;
  const users = readJSON("users.json", []);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (name && name.trim().length >= 2) user.name = name.trim();
  if (email && validateEmail(email)) user.email = email.toLowerCase();
  if (!user.settings) user.settings = {};
  if (notificationsEnabled !== undefined) user.settings.notificationsEnabled = notificationsEnabled;
  if (darkMode !== undefined) user.settings.darkMode = darkMode;
  if (commentsEnabled !== undefined) user.settings.commentsEnabled = commentsEnabled;
  if (profilePrivacy) user.settings.profilePrivacy = profilePrivacy;

  writeJSON("users.json", users);
  res.json({ message: "Settings updated", user: sanitizeUser(user) });
});

// ============ SUBSCRIPTIONS (no auth required — works with existing frontend) ============
app.get("/api/users/:id/subscriptions", (req, res) => {
  const user = readJSON("users.json", []).find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  const channels = readJSON("channels.json", []);
  res.json(channels.filter(c => user.subscriptions.includes(c.id)));
});

app.post("/api/users/:id/subscriptions/:channelId", (req, res) => {
  const userId = parseInt(req.params.id);
  const channelId = parseInt(req.params.channelId);

  const users = readJSON("users.json", []);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Verify channel actually exists
  const channels = readJSON("channels.json", []);
  const channel = channels.find(c => c.id === channelId);
  if (!channel) return res.status(404).json({ error: "Channel not found" });

  if (!user.subscriptions.includes(channelId)) {
    user.subscriptions.push(channelId);
    writeJSON("users.json", users);
  }
  res.json({ message: "Subscribed successfully", subscriptions: user.subscriptions });
});

app.delete("/api/users/:id/subscriptions/:channelId", (req, res) => {
  const userId = parseInt(req.params.id);
  const channelId = parseInt(req.params.channelId);

  const users = readJSON("users.json", []);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.subscriptions = user.subscriptions.filter(c => c !== channelId);
  writeJSON("users.json", users);
  res.json({ message: "Unsubscribed successfully", subscriptions: user.subscriptions });
});

// ============ COMMENTS (GET public, POST open — frontend sends userId in body) ============
app.get("/api/videos/:videoId/comments", (req, res) => {
  const videoId = parseInt(req.params.videoId);
  res.json(readJSON("comments.json", []).filter(c => c.videoId === videoId));
});

app.post("/api/videos/:videoId/comments", (req, res) => {
  const videoId = parseInt(req.params.videoId);
  const { userId, userName, text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Comment text is required" });

  const comments = readJSON("comments.json", []);
  const newComment = {
    id: comments.length ? Math.max(...comments.map(c => c.id)) + 1 : 1,
    videoId,
    userId: userId || 1,
    userName: userName || "Guest",
    text: text.trim(),
    timestamp: new Date().toISOString(),
    likes: 0,
  };
  comments.push(newComment);
  writeJSON("comments.json", comments);
  res.status(201).json({ message: "Comment added", comment: newComment });
});

// ============ CHANNELS ============
app.get("/api/channels", (req, res) => res.json(readJSON("channels.json", [])));
app.get("/api/channels/:id", (req, res) => {
  const channel = readJSON("channels.json", []).find(c => c.id === parseInt(req.params.id));
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  const videos = readJSON("videos.json", []).filter(v => v.channel === channel.name);
  res.json({ ...channel, videos });
});

// ============ PLAYLISTS ============
app.get("/api/playlists", (req, res) => res.json(readJSON("playlists.json", [])));

app.post("/api/playlists", (req, res) => {
  const { name, privacy } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Playlist name required" });
  const playlists = readJSON("playlists.json", []);
  const newPl = {
    id: playlists.length ? Math.max(...playlists.map(p => p.id)) + 1 : 1,
    name: name.trim(),
    privacy: privacy || "private",
    videoIds: [],
    createdAt: new Date().toISOString()
  };
  playlists.push(newPl);
  writeJSON("playlists.json", playlists);
  res.status(201).json(newPl);
});

app.put("/api/playlists/:id", (req, res) => {
  const playlists = readJSON("playlists.json", []);
  const pl = playlists.find(p => p.id === parseInt(req.params.id));
  if (!pl) return res.status(404).json({ error: "Playlist not found" });
  if (req.body.name) pl.name = req.body.name.trim();
  if (req.body.privacy) pl.privacy = req.body.privacy;
  if (req.body.videoIds) pl.videoIds = req.body.videoIds;
  writeJSON("playlists.json", playlists);
  res.json(pl);
});

app.post("/api/playlists/:id/videos", (req, res) => {
  const { videoId } = req.body;
  const playlists = readJSON("playlists.json", []);
  const pl = playlists.find(p => p.id === parseInt(req.params.id));
  if (!pl) return res.status(404).json({ error: "Playlist not found" });
  if (!pl.videoIds.includes(videoId)) pl.videoIds.push(videoId);
  writeJSON("playlists.json", playlists);
  res.json(pl);
});

app.delete("/api/playlists/:plId/videos/:videoId", (req, res) => {
  const playlists = readJSON("playlists.json", []);
  const pl = playlists.find(p => p.id === parseInt(req.params.plId));
  if (!pl) return res.status(404).json({ error: "Playlist not found" });
  pl.videoIds = pl.videoIds.filter(v => v !== parseInt(req.params.videoId));
  writeJSON("playlists.json", playlists);
  res.json(pl);
});

app.delete("/api/playlists/:id", (req, res) => {
  let playlists = readJSON("playlists.json", []);
  playlists = playlists.filter(p => p.id !== parseInt(req.params.id));
  writeJSON("playlists.json", playlists);
  res.json({ message: "Playlist deleted" });
});

// ============ WATCH HISTORY ============
app.get("/api/history", (req, res) => res.json(readJSON("history.json", [])));

app.post("/api/history", (req, res) => {
  const { videoId, progress } = req.body;
  let history = readJSON("history.json", []);
  history = history.filter(h => h.videoId !== videoId);
  history.unshift({ videoId, progress: progress || 0, watchedAt: new Date().toISOString() });
  if (history.length > 200) history = history.slice(0, 200);
  writeJSON("history.json", history);
  res.json({ message: "History updated" });
});

app.delete("/api/history", (req, res) => {
  writeJSON("history.json", []);
  res.json({ message: "History cleared" });
});

// ============ SERVE INDEX ============
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(PORT, () => {
  console.log(`✅ YouTube Clone running at http://localhost:${PORT}`);
  console.log(`🔐 bcrypt: ${bcrypt ? "enabled" : "plain-text fallback"}`);
  console.log(`🎫 JWT: ${jwt ? "enabled" : "disabled"}`);
});
