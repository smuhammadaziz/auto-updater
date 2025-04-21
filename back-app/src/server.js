// server.js
const app = require("./app");
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.set("io", io);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

