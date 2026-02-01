# ARCHITECTURE.md
## Real-Time Collaborative Drawing Canvas

---

## 1. Overview

This project is a real-time collaborative drawing application where multiple users can draw simultaneously on a shared canvas.  
The system is designed using a **server-authoritative architecture** to ensure all users see a consistent and synchronized canvas state.

The main challenges addressed are:
- Real-time synchronization
- Global undo/redo
- Conflict handling
- Efficient canvas rendering using the raw HTML Canvas API

---

## 2. High-Level Architecture

The system consists of two main components:

- **Client**
  - HTML + CSS + JavaScript
  - Raw HTML Canvas API
  - WebSocket client (Socket.IO)
- **Server**
  - Node.js
  - Socket.IO WebSocket server
  - Room-based state management

The server is the single source of truth for all drawing operations.

---

## 3. Data Flow

### Drawing Flow

1. User input (mouse events) is captured on the client.
2. Input is converted into stroke events.
3. Stroke events are sent to the server via WebSockets.
4. The server updates the room’s operation log.
5. The updated state is broadcast to all connected clients.
6. Clients deterministically redraw the canvas from the operation log.

User Input
↓
Client Stroke Events
↓
WebSocket Server
↓
Authoritative Operation Log
↓
Broadcast Updated State
↓
Clients Re-render Canvas


---

## 4. Canvas Rendering Strategy

### Dual Canvas Layering

Two canvas layers are used:

- **Permanent Canvas**
  - Contains only server-confirmed strokes
  - Redrawn from the operation log
  - Never mutated directly during drawing

- **Live Canvas**
  - Used for real-time stroke previews
  - Cleared frequently
  - Does not affect shared state

This separation prevents flickering, improves performance, and keeps rendering deterministic.

---

## 5. WebSocket Protocol

### Events

| Event Name        | Direction                     | Description |
|------------------|--------------------------------|-------------|
| `stroke:start`   | Client → Server → Peers        | Start live stroke preview |
| `stroke:update`  | Client → Server → Peers        | Stream stroke points |
| `stroke:end`     | Client → Server                | Commit stroke to history |
| `history:init`   | Server → Client                | Initial canvas state |
| `history:update` | Server → Clients               | Updated operation log |
| `undo`           | Client → Server                | Global undo |
| `redo`           | Client → Server                | Global redo |
| `cursor:move`    | Client → Server → Peers        | Cursor movement |
| `users:update`   | Server → Clients               | Online users list |

---

## 6. Stroke Data Model

Each stroke is represented as a serializable object:

```js
{
  id: string,
  tool: "brush" | "eraser",
  color: string,
  size: number,
  points: [{ x: number, y: number }],
  timestamp: number
}
This model allows deterministic replay, network transmission, and global undo/redo.

7. Undo / Redo Strategy (Global)
Undo and redo are implemented using a server-side linear operation log.

The server maintains:

operations[] – committed strokes

redoStack[] – undone strokes

Undo removes the most recent stroke globally, regardless of author.

Redo reapplies the most recently undone stroke.

After each undo or redo, the server broadcasts the updated operation list.

Clients redraw the canvas from scratch to ensure consistency.

Design Decision
Undo/redo is intentionally global to:

Maintain a single authoritative history

Avoid divergent canvas states

Simplify conflict resolution

8. Conflict Handling
Simultaneous drawing conflicts are handled using server-enforced ordering.

The server defines a total order of strokes.

Later strokes overwrite earlier strokes in overlapping regions.

No per-pixel locking or merging is performed.

This approach favors determinism and simplicity.

9. Eraser Design
The eraser tool uses the Canvas API:

globalCompositeOperation = "destination-out"
Live Preview Limitation
The live preview canvas is transparent.

destination-out requires existing pixels to erase.

Therefore, real-time erasing cannot be previewed directly.

Solution
A visual eraser indicator is shown during interaction.

The actual erase is applied only after server confirmation.

This prevents client-side divergence and maintains server authority.

10. Performance Decisions
Key performance optimizations include:

Dual canvas rendering (live vs permanent)

Cursor movement throttling

Stroke point batching

Redraws triggered only by state changes

Tradeoffs
The full operation log is broadcast on each update for simplicity.

This ensures strong consistency but limits scalability.

Future optimizations could include snapshotting or incremental diffs.

11. State Synchronization Guarantees
The server is the single source of truth.

Clients never mutate shared state directly.

All clients eventually converge to the same canvas state.

12. Known Limitations
Undo/redo is global and may remove strokes from other users.

The full canvas is redrawn on every history update.

Eraser preview is visual only.

These are intentional design tradeoffs to prioritize correctness and clarity.

13. Summary
This architecture prioritizes:

Consistency over local autonomy

Deterministic rendering

Clear separation of responsibilities

The result is a robust real-time collaborative drawing system with predictable behavior under concurrent usage.