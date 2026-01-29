const permanentCanvas = document.getElementById("permanent");
const liveCanvas = document.getElementById("live");

const WIDTH = 900;
const HEIGHT = 500;

permanentCanvas.width = liveCanvas.width = WIDTH;
permanentCanvas.height = liveCanvas.height = HEIGHT;

const pCtx = permanentCanvas.getContext("2d");

// Drawing state
let drawing = false;
let currentTool = "brush";
let currentColor = "#000000";
let currentSize = 4;
let lastPoint = null;

// Toolbar elements
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");


colorPicker.addEventListener("change", (e) => {
  currentColor = e.target.value;
});

brushSize.addEventListener("input", (e) => {
  currentSize = e.target.value;
});


function setActiveTool(tool) {
  currentTool = tool;
  brushBtn.classList.toggle("active", tool === "brush");
  eraserBtn.classList.toggle("active", tool === "eraser");
}

brushBtn.addEventListener("click", () => setActiveTool("brush"));
eraserBtn.addEventListener("click", () => setActiveTool("eraser"));
setActiveTool("brush");


function getMousePos(e) {
  const rect = permanentCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function drawLine(ctx, from, to) {
  ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
  ctx.lineWidth = currentSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}


liveCanvas.addEventListener("mousedown", (e) => {
  drawing = true;
  lastPoint = getMousePos(e);
  drawLine(pCtx, lastPoint, lastPoint);
});

liveCanvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  const point = getMousePos(e);
  drawLine(pCtx, lastPoint, point);
  lastPoint = point; 
});

liveCanvas.addEventListener("mouseup", () => {
  drawing = false;
  lastPoint = null;
});

liveCanvas.addEventListener("mouseleave", () => {
  drawing = false;
  lastPoint = null;
});