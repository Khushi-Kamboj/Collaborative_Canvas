const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("client"));

// 🔑 In-memory history (per app / per room later)
const operations = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

   // 🔹 Send full history to the new user
  socket.emit("history:init", operations);

  // 🔹 Receive new stroke
  socket.on("draw:stroke", (stroke) => {
    operations.push(stroke);

    // broadcast to others
    io.emit("draw:stroke", stroke);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
