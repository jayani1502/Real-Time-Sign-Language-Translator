const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const replayBtn = document.getElementById("replayBtn");
const videoArea = document.getElementById("videoArea");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");

let hands, camera;
let lastGesture = "";
let lastSpoken = "";

async function initHands() {
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
  });
  hands.onResults(onResults);
}

function onResults(results) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length) {
    const lm = results.multiHandLandmarks[0];
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00ff00", lineWidth: 2 });
    drawLandmarks(ctx, lm, { color: "#ff0000", lineWidth: 1 });

    const gesture = detectGesture(lm);
    if (gesture && gesture !== lastGesture) {
      showResult(gesture);
      speak(gesture);
      lastGesture = gesture;
      lastSpoken = gesture;
    }
  }
  ctx.restore();
}

// Simple rule-based gesture detection
function detectGesture(lm) {
  const wristY = lm[0].y;
  const indexY = lm[8].y;
  const thumbX = lm[4].x;
  const indexX = lm[8].x;

  if (indexY < wristY) return "Hello";
  if (thumbX < indexX) return "I Love You";
  if (indexY > wristY) return "Thank You";
  return null;
}

function showResult(text) {
  resultText.textContent = text;
  resultBox.classList.remove("hidden");
  replayBtn.disabled = false;
}

function speak(text) {
  const synth = window.speechSynthesis;
  synth.cancel(); // stop previous speech
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = 1;
  utter.rate = 1;
  synth.speak(utter);
}

// Replay audio
replayBtn.onclick = () => {
  if (lastSpoken) speak(lastSpoken);
};

// Camera start/stop
startBtn.onclick = async () => {
  await initHands();
  videoArea.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  camera = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 340,
    height: 260,
  });
  camera.start();
};

stopBtn.onclick = () => {
  camera.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  videoArea.classList.add("hidden");
};
