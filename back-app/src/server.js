// server.js
const app = require("./app");
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const path = require("path");
const fs = require("fs");

// Make the user data path available throughout the app
if (process.env.KSB_USER_DATA_PATH) {
  // If passed from Electron, use that path
  process.env.DATABASE_PATH = path.join(
    process.env.KSB_USER_DATA_PATH,
    "storage.db"
  );
  console.log(`Using database at ${process.env.DATABASE_PATH} (from Electron)`);
} else {
  // Fallback for development or if run directly
  const appDbPath = path.join(__dirname, "storage.db");
  process.env.DATABASE_PATH = appDbPath;
  console.log(`Using database at ${process.env.DATABASE_PATH} (local)`);
}

app.set("io", io);
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
