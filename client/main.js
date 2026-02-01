// main.js
import "./websocket.js";
import "./canvas.js";

// ==========================
// App Bootstrap Logic
// ==========================

// DOM references
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("usernameInput");
const namePrompt = document.getElementById("namePrompt");
const appContainer = document.querySelector(".app-container");

// Wait for socket to be ready
window.socket.on("connect", () => {
  console.log(
    "Connected:",
    window.socket.id,
    "Room:",
    window.ROOM_ID
  );
});

// Handle Join Button
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter your name");
    return;
  }

  // Save name globally (simple, no auth)
  window.USER_NAME = name;

  // Hide prompt, show app
  namePrompt.style.display = "none";
  appContainer.style.display = "flex";

  // Inform server
  window.socket.emit("user:join", { name });

  console.log("User joined with name:", name);
});

console.log("Canvas app loaded");