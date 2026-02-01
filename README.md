# 🎨 Real-Time Collaborative Drawing Canvas

A real-time collaborative drawing application where multiple users can draw simultaneously on a shared canvas and see each other’s changes instantly.

This project is built using the **raw HTML Canvas API** and **WebSockets (Socket.IO)** with a **server-authoritative architecture** to ensure consistency across all connected users.

---

## ✨ Features

### 🖌️ Drawing Tools
- Brush
- Eraser
- Multiple colors
- Adjustable stroke width

### ⚡ Real-Time Collaboration
- Multiple users can draw at the same time
- Drawing strokes are visible to other users while drawing
- Real-time cursor movement indicators

### 👥 User Management
- Online users list
- Unique color assigned to each user
- Visual cursor indicators for active users

### ↩️ Global Undo / Redo
- Undo and redo work globally across all users
- Any user can undo or redo the most recent stroke
- Undo/redo actions are synchronized in real time

### 🧠 Conflict Handling
- Simultaneous drawing conflicts are resolved using server-side ordering
- Later strokes overwrite earlier strokes in overlapping regions

---

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- Raw HTML Canvas API (no canvas or drawing libraries used)

### Backend
- Node.js
- Express
- Socket.IO (WebSockets)

---

## 📁 Project Structure

collaborative-canvas/
├── client/
│ ├── index.html
│ ├── style.css
│ ├── canvas.js
│ ├── websocket.js
│ └── main.js
├── server/
│ ├── server.js
│ └── rooms.js
├── package.json
├── README.md
└── ARCHITECTURE.md


---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm

---

### Installation

```bash
npm install
Run the Application
npm start
The server will start at:

http://localhost:3000
🧪 How to Test with Multiple Users
Open http://localhost:3000 in two or more browser tabs

Enter a different username in each tab

Start drawing on the canvas

Verify the following:

Other users’ strokes appear in real time

Cursor positions are visible

Undo/redo affects all users

🧠 Design Decisions (Summary)
Server-authoritative state

The server is the single source of truth

Clients never mutate shared canvas state directly

Dual canvas strategy

Permanent canvas: server-confirmed strokes only

Live canvas: real-time drawing preview

Global undo/redo

Undo and redo operate on the shared operation log

Any user can undo another user’s stroke by design

Eraser implementation

Uses globalCompositeOperation = "destination-out"

Real-time erasing is applied only after server confirmation

Detailed explanations are provided in ARCHITECTURE.md.

⚠️ Known Limitations
Undo/redo is global (not per-user)

Full canvas redraw occurs on each history update

Eraser preview is visual only

Server state is stored in memory (no database persistence)

These are intentional tradeoffs made for simplicity, correctness, and determinism.

⏱️ Time Spent
Approximate time spent on the project:

12–15 hours
This includes:

Canvas rendering logic

WebSocket real-time synchronization

Global undo/redo implementation

Debugging and documentation

📌 Future Improvements
Incremental canvas updates instead of full redraw

Snapshot-based history for large sessions

Per-user undo/redo mode

Database persistence

Touch and stylus support

📄 License
This project is created for educational and evaluation purposes.