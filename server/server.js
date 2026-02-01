const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const {
  getRoom,
  addOperation,
  undoOperation,
  redoOperation, 
  getOperations,
  addUser,
  removeUser,
  getUsers
} = require("./rooms");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("client"));

io.on("connection", (socket) => {
  const rawRoomId = socket.handshake.query?.roomId;
  const roomId =
    typeof rawRoomId === "string" && rawRoomId.trim()
      ? rawRoomId
      : "global";

  // const roomId = socket.handshake.query.roomId || "global";
  socket.join(roomId);

  
  console.log(`User ${socket.id} joined room ${roomId}`);

  // Send room history on join
  socket.emit("history:init", getOperations(roomId));

  // New stroke
  socket.on("draw:stroke", (stroke) => {
    addOperation(roomId, stroke);

    // always sync full history
    io.to(roomId).emit("history:update", getOperations(roomId));
  });

  // Global undo (room-scoped)
  socket.on("undo", () => {
    const removed = undoOperation(roomId);
    if (!removed) return;

    io.to(roomId).emit("history:update", getOperations(roomId));
  });

  // Redo 
    socket.on("redo", () => {
    const redone = redoOperation(roomId);
    if (!redone) return;

    io.to(roomId).emit("history:update", getOperations(roomId));
  });

  // Cursor movement
  socket.on("cursor:move", (data) => {
    socket.to(roomId).emit("cursor:move", {
      id: socket.id,
      x: data.x,
      y: data.y
    });
  });

  socket.on("user:join", ({ name }) => {
    const color = generateColor(socket.id);

    addUser(roomId, socket.id, { name, color });

    // notify everyone in room
    io.to(roomId).emit("users:update", getUsers(roomId));
  });

  // Disconnect
  socket.on("disconnect", () => {
    removeUser(roomId, socket.id);

    io.to(roomId).emit("users:update", getUsers(roomId));
    socket.to(roomId).emit("cursor:leave", socket.id);

    console.log(`User ${socket.id} left room ${roomId}`);
  });
});

function generateColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
}

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
