# 🎨 Collaborative Canvas (Real-Time Whiteboard)


A real-time collaborative drawing application built with **HTML Canvas**, **Socket.IO**, and **Node.js**.  
The project focuses on **real-time state synchronization**, **server-authoritative undo/redo**, and **multi-user collaboration**.


---


## 🚀 Features


- Real-time multi-user drawing
- Room-based collaboration (isolated canvases)
- Server-authoritative undo / redo
- Live cursor tracking for all users
- User presence with name and unique color
- “Last seen” cursor marker when a user disconnects
- Smooth drawing using optimized canvas paths


---


## 🛠 Tech Stack


- **Frontend:** Vanilla JavaScript, HTML5 Canvas, CSS  
- **Backend:** Node.js, Express  
- **Real-time:** Socket.IO  


---


## 📦 Setup & Run


### Prerequisites
- Node.js (v16+ recommended)
- npm


### Install & Start

npm install
npm start

App runs at:

http://localhost:3000

###  Testing with Multiple Users
  - Same Room
  - Open multiple browser tabs
  - Enter different usernames
  - Draw simultaneously and test undo/redo
  - Different Rooms

Use query params:

http://localhost:3000/?room=room1
http://localhost:3000/?room=room2

Each room maintains:
- Independent canvas
- Independent users
- Independent history

Cross-Browser
Open one tab in incognito or a different browser to simulate multiple users

### Key Design Decisions

- Server is the single source of truth for canvas history
- Clients only render server-provided state
- Undo/redo is global and room-scoped
- User colors are assigned once on the server and reused consistently
- Cursor positions use canvas-local coordinates normalized to screen space

#### ⚠️ Known Limitations

- No authentication (users are socket-session based)
- Canvas state is stored in memory (resets on server restart)
- User color may change after refresh
- Not optimized for very large histories
- No mobile/touch support yet

#### ⏱ Time Spent

~18–22 hours, including:
- Canvas rendering & smoothing
- Real-time socket communication
- Server-side history management
- Undo/redo correctness
- Multi-room architecture
- Cursor synchronization & edge-case handling

#### 🔮 Future Improvements

- Persistent storage (DB)
- Authentication & user profiles
- Per-user undo/redo
- Touch & mobile support
- Export canvas as image
