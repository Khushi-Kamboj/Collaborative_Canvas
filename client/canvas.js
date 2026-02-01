// ==========================
// Socket & Canvas Setup
// ==========================

const socket = window.socket;

const permanentCanvas = document.getElementById("permanent");
const liveCanvas = document.getElementById("live");

const WIDTH = 900;
const HEIGHT = 400;

permanentCanvas.width = liveCanvas.width = WIDTH;
permanentCanvas.height = liveCanvas.height = HEIGHT;

const pCtx = permanentCanvas.getContext("2d");
const lCtx = liveCanvas.getContext("2d");


// ==========================
// History State
// ==========================

const operations = [];
let hasHistory = false;
const pendingStrokes = [];


// ==========================
// Drawing State
// ==========================

let drawing = false;
let currentTool = "brush";
let currentColor = "#000000";
let currentSize = 4;
let pointsBuffer = [];
let activeStroke = null;
const liveRemoteStrokes = {};


// ==========================
// Toolbar Elements
// ==========================

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");


// ==========================
// Cursor Layer (Multiplayer)
// ==========================

const cursorLayer = document.getElementById("cursor-layer");
const cursors = {};
const usersMap = {};


// ==========================
// UI Bindings
// ==========================

colorPicker.addEventListener("change", (e) => {
  currentColor = e.target.value;
});

brushSize.addEventListener("input", (e) => {
  currentSize = e.target.value;
});


// ==========================
// Tool Selection
// ==========================

function setActiveTool(tool) {
  currentTool = tool;
  brushBtn.classList.toggle("active", tool === "brush");
  eraserBtn.classList.toggle("active", tool === "eraser");
}

brushBtn.addEventListener("click", () => setActiveTool("brush"));
eraserBtn.addEventListener("click", () => setActiveTool("eraser"));

setActiveTool("brush");


// ==========================
// Helpers
// ==========================

function getMousePos(e) {
  const rect = permanentCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}


// ==========================
// Cursor Throttling
// ==========================

let lastCursorEmit = 0;

function emitCursorMove(x, y) {
  const now = Date.now();
  if (now - lastCursorEmit < 30) return;
  lastCursorEmit = now;
  socket.emit("cursor:move", { x, y });
}


// ==========================
// Stroke Rendering
// ==========================

function renderStroke(ctx, stroke) {
  const { tool, color, size, points } = stroke;

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }

  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  ctx.lineTo(points.at(-1).x, points.at(-1).y);
  ctx.stroke();
}


// ==========================
// Canvas Redraw
// ==========================

function redrawCanvas() {
  pCtx.clearRect(0, 0, WIDTH, HEIGHT);
  for (const op of operations) {
    renderStroke(pCtx, op);
  }
}


// ==========================
// Undo / Redo
// ==========================

undoBtn.addEventListener("click", () => socket.emit("undo"));
redoBtn.addEventListener("click", () => socket.emit("redo"));


// ==========================
// Drawing Events
// ==========================

liveCanvas.addEventListener("mousedown", (e) => {
  drawing = true;
  const start = getMousePos(e);

  activeStroke = {
    id: Date.now() + Math.random(),
    tool: currentTool,
    color: currentColor,
    size: currentSize,
    points: [start]
  };

  socket.emit("stroke:start", activeStroke);
});

liveCanvas.addEventListener("mousemove", (e) => {
  const pos = getMousePos(e);
  emitCursorMove(pos.x, pos.y);

  if (!drawing || !activeStroke) return;

  activeStroke.points.push(pos);

  lCtx.clearRect(0, 0, WIDTH, HEIGHT);

  if (activeStroke.tool !== "eraser") {
    renderStroke(lCtx, activeStroke);
  }

  socket.emit("stroke:update", {
    strokeId: activeStroke.id,
    point: pos
  });
});

liveCanvas.addEventListener("mouseup", () => {
  if (!drawing || !activeStroke) return;
  drawing = false;

  socket.emit("stroke:end", activeStroke);
  activeStroke = null;

  lCtx.clearRect(0, 0, WIDTH, HEIGHT);
});

liveCanvas.addEventListener("mouseleave", () => {
  drawing = false;
  activeStroke = null;
  lCtx.clearRect(0, 0, WIDTH, HEIGHT);
});


// ==========================
// Remote Live Strokes
// ==========================

socket.on("stroke:start", (stroke) => {
  liveRemoteStrokes[stroke.id] = stroke;
});

socket.on("stroke:update", ({ strokeId, point }) => {
  const stroke = liveRemoteStrokes[strokeId];
  if (!stroke) return;

  stroke.points.push(point);

  lCtx.clearRect(0, 0, WIDTH, HEIGHT);
  Object.values(liveRemoteStrokes).forEach(s => {
    if (s.tool !== "eraser") renderStroke(lCtx, s);
  });
});


// ==========================
// History Sync
// ==========================

socket.on("history:init", (serverOperations) => {
  operations.length = 0;
  operations.push(...serverOperations);
  redrawCanvas();
});

socket.on("history:update", (serverOperations) => {
  operations.length = 0;
  operations.push(...serverOperations);
  redrawCanvas();

  Object.keys(liveRemoteStrokes).forEach(k => delete liveRemoteStrokes[k]);
  lCtx.clearRect(0, 0, WIDTH, HEIGHT);
});
