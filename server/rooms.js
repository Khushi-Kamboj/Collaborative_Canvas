// server/rooms.js

// rooms = {
//   roomId: {
//     operations: []
//   }
// }

const rooms = {};

function getRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      operations: []
    };
  }
  return rooms[roomId];
}

function addOperation(roomId, operation) {
  const room = getRoom(roomId);
  room.operations.push(operation);
}

function undoOperation(roomId) {
  const room = getRoom(roomId);
  if (room.operations.length === 0) return null;
  return room.operations.pop();
}

function getOperations(roomId) {
  const room = getRoom(roomId);
  return [...room.operations]; // defensive copy
}


module.exports = {
  getRoom,
  addOperation,
  undoOperation,
  getOperations
};
