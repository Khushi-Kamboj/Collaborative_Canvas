// server/rooms.js

// rooms = {
//   roomId: {
//     operations: [],
//     redoStack: []
//   }
// }

const rooms = {};

function getRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      operations: [],
      redoStack: []
    };
  }
  return rooms[roomId];
}

// Add new stroke
function addOperation(roomId, operation) {
  const room = getRoom(roomId);
  room.operations.push(operation);

  // 🔑 Any new draw clears redo history
  room.redoStack.length = 0;
}

// Undo last stroke
function undoOperation(roomId) {
  const room = getRoom(roomId);
  if (room.operations.length === 0) return null;

  const undone = room.operations.pop();
  room.redoStack.push(undone);
  return undone;
}

// Redo last undone stroke
function redoOperation(roomId) {
  const room = getRoom(roomId);
  if (room.redoStack.length === 0) return null;

  const redone = room.redoStack.pop();
  room.operations.push(redone);
  return redone;
}

// Get current history
function getOperations(roomId) {
  const room = getRoom(roomId);
  return [...room.operations]; // defensive copy
}

module.exports = {
  getRoom,
  addOperation,
  undoOperation,
  redoOperation,
  getOperations
};