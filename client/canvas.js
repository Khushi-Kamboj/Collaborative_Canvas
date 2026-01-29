const socket = window.socket;

const permanentCanvas = document.getElementById("permanent");
const liveCanvas = document.getElementById("live");

const WIDTH = 900;
const HEIGHT = 400;

permanentCanvas.width = liveCanvas.width = WIDTH;
permanentCanvas.height = liveCanvas.height = HEIGHT;

const pCtx = permanentCanvas.getContext("2d");
const lCtx = liveCanvas.getContext("2d");

// Operation store
const operations = [];
const redoStack = [];

let hasHistory = false;
const pendingStrokes = [];

// Drawing state
let drawing = false;
let currentTool = "brush";
let currentColor = "#000000";
let currentSize = 4;
let pointsBuffer = [];

// Toolbar elements
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

redoBtn.disabled = true;

const cursorLayer = document.getElementById("cursor-layer");
const cursors = {}; // socketId -> DOM element


// UI bindings
colorPicker.addEventListener("change", (e) => {
  currentColor = e.target.value;
});

brushSize.addEventListener("input", (e) => {
  currentSize = e.target.value;
});

// Tool selection logic
function setActiveTool(tool) {
  currentTool = tool;
  brushBtn.classList.toggle("active", tool === "brush");
  eraserBtn.classList.toggle("active", tool === "eraser");
}

brushBtn.addEventListener("click", () => setActiveTool("brush"));
eraserBtn.addEventListener("click", () => setActiveTool("eraser"));
setActiveTool("brush");

// Helpers
function getMousePos(e) {
  const rect = permanentCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}
function createStrokeOperation(points) {
  return {
    id: Date.now() + Math.random(),
    tool: currentTool,
    color: currentColor,
    size: currentSize,
    points: [...points],
    timestamp: Date.now()
  };
}

let lastCursorEmit = 0;

function emitCursorMove(x, y) {
  const now = Date.now();
  if (now - lastCursorEmit < 30) return; // ~30fps

  lastCursorEmit = now;
  socket.emit("cursor:move", { x, y });
}

function getColorFromId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
}


function renderStroke(ctx, stroke) {
  const { tool, color, size, points } = stroke;

  ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ✅ Single point = dot
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.fill();
    return;
  }

  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  ctx.lineTo(
    points[points.length - 1].x,
    points[points.length - 1].y
  );

  ctx.stroke();
}

function redrawCanvas() {
  // Clear permanent canvas
  pCtx.clearRect(0, 0, WIDTH, HEIGHT);

  // Re-render all operations
  for (const op of operations) {
    renderStroke(pCtx, op);
  }
}

undoBtn.addEventListener("click", () => {
  socket.emit("undo");
});


redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;

  const redoOp = redoStack.pop();
  operations.push(redoOp);
  redrawCanvas();
});

liveCanvas.addEventListener("mousedown", (e) => {
  drawing = true;
  pointsBuffer = [];

  const start = getMousePos(e);
  pointsBuffer.push(start);

  // 🔑 draw a dot immediately
  const dotStroke = createStrokeOperation(pointsBuffer);
  renderStroke(pCtx, dotStroke);
});

liveCanvas.addEventListener("mousemove", (e) => {
  const pos = getMousePos(e);
  emitCursorMove(pos.x, pos.y);

  if (!drawing) return;

  pointsBuffer.push(pos);
  lCtx.clearRect(0, 0, WIDTH, HEIGHT);

  const previewStroke = createStrokeOperation(pointsBuffer);
  renderStroke(lCtx, previewStroke);
});


liveCanvas.addEventListener("mouseup", () => {
  if (!drawing) return;
  drawing = false;

  const strokeOp = createStrokeOperation(pointsBuffer);
  // operations.push(strokeOp);
  redoStack.length = 0; // clear redo history on new action

  // Commit stroke
  renderStroke(pCtx, strokeOp);

  // send to server
  socket.emit("draw:stroke", strokeOp);

  lCtx.clearRect(0, 0, WIDTH, HEIGHT);
  pointsBuffer = [];
});

liveCanvas.addEventListener("mouseleave", () => {
  drawing = false;
  pointsBuffer = [];
  lCtx.clearRect(0, 0, WIDTH, HEIGHT);
});

socket.on("draw:stroke", (strokeOp) => {
  if (!hasHistory) {
    pendingStrokes.push(strokeOp);
    return;
  }

  operations.push(strokeOp);
  redoStack.length = 0;
  renderStroke(pCtx, strokeOp);
});

socket.on("history:init", (serverOperations) => {
  console.log("History received:", serverOperations.length);

  operations.length = 0;
  redoStack.length = 0;

  for (const op of serverOperations) {
    operations.push(op);
  }

  redrawCanvas();

  // 🔑 mark history as loaded
  hasHistory = true;

  // 🔑 apply any strokes received during init
  for (const stroke of pendingStrokes) {
    operations.push(stroke);
    renderStroke(pCtx, stroke);
  }

  pendingStrokes.length = 0;
});

socket.on("history:update", (serverOperations) => {
  operations.length = 0;
  redoStack.length = 0;

  for (const op of serverOperations) {
    operations.push(op);
  }

  redrawCanvas();
});

socket.on("cursor:move", ({ id, x, y }) => {
  let cursor = cursors[id];

  if (!cursor) {
    cursor = document.createElement("div");
    cursor.className = "remote-cursor";
    cursor.style.background = getColorFromId(id);
    cursorLayer.appendChild(cursor);
    cursors[id] = cursor;
  }

  cursor.style.left = x + "px";
  cursor.style.top = y + "px";
});

socket.on("cursor:leave", (id) => {
  const cursor = cursors[id];
  if (cursor) {
    cursor.remove();
    delete cursors[id];
  }
});
