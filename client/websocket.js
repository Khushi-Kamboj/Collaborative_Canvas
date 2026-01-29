const params = new URLSearchParams(window.location.search);
window.ROOM_ID = params.get("room") || "global";

window.socket = io({
  query: { roomId: window.ROOM_ID }
});

window.socket.on("connect", () => {
  console.log("Connected to server:", window.socket.id, "Room:", window.ROOM_ID);
});
