import { ExerciseCoach } from './exerciseLogic.js';
import { VoiceEngine } from './voiceEngine.js';

// 1. Initialize Modules
const coach = new ExerciseCoach();
const voice = new VoiceEngine();

// 2. DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const exerciseSelect = document.getElementById('exerciseSelect');

let camera = null;

// 3. MediaPipe Pose Setup
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

// 4. The Detection Loop (Logic & UI)
pose.onResults((results) => {
  if (!results.poseLandmarks) return;

  // Sync canvas size to video stream
  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  // --- RENDER SKELETON ---
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  
  // Custom colors matching your PRO theme
  drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00ffcc", lineWidth: 3 });
  drawLandmarks(ctx, results.poseLandmarks, { color: "#ff2d55", lineWidth: 1 });
  ctx.restore();

  // --- CALCULATE PROGRESS ---
  const currentExercise = exerciseSelect.value;
  const prevReps = coach.reps;
  
  // This calls the logic that uses your EXACT OG angles and thresholds
  const stats = coach.processPose(results.poseLandmarks, currentExercise);

  // VOICE FEEDBACK: Call out the number on a successful rep
  if (stats.reps > prevReps) {
    voice.speak(stats.reps.toString());
  }

  // --- UPDATE DASHBOARD ---
  updateUI(stats);
});

function updateUI(stats) {
  // Main Rep Counter
  document.getElementById('repCount').innerText = stats.reps;
  
  // Detailed Metrics (Matching your OG display)
  document.getElementById('stat-knee').innerText = `${stats.kneeAngle.toFixed(0)}°`;
  document.getElementById('stat-hip').innerText = `${stats.hipAngle.toFixed(0)}°`;
  document.getElementById('stat-arm').innerText = `${stats.handAngle.toFixed(0)}°`;
  
  // These map to the extra boxes in your PRO UI
  if(document.getElementById('stat-leg')) document.getElementById('stat-leg').innerText = `${stats.legAngle.toFixed(0)}°`;
  if(document.getElementById('stat-chest')) document.getElementById('stat-chest').innerText = `${stats.chestAngle.toFixed(0)}°`;
  if(document.getElementById('stat-abs')) document.getElementById('stat-abs').innerText = `${stats.absAngle.toFixed(0)}°`;
  if(document.getElementById('stat-neck')) document.getElementById('stat-neck').innerText = `${stats.neckAngle.toFixed(0)}°`;

  // Visual State Indicator
  const stateEl = document.getElementById('stat-state');
  stateEl.innerText = stats.state.toUpperCase();
  stateEl.style.color = stats.state === "down" ? "#fbbf24" : "#10b981"; 
}

// 5. App Controls
async function startWorkout() {
  coach.reset();
  voice.speak("Let's get to work!");
  voice.startListening();

  startBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');

  camera = new Camera(video, {
    onFrame: async () => {
      await pose.send({ image: video });
    },
    width: 640,
    height: 480
  });
  
  try {
    await camera.start();
  } catch (err) {
    console.error("Camera failed:", err);
    alert("Camera access is required for AI coaching.");
  }
}

function stopWorkout() {
  if (camera) {
    camera.stop();
    camera = null;
  }
  startBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
}

// 6. Voice Command Listeners
// These respond to the VoiceEngine's interpretations
window.addEventListener('voice-stop-request', () => {
  // Handles "Not possible" or "I can't do more"
  voice.speak(`Alright, don't hurt yourself. You've already done ${coach.reps} reps!`);
  stopWorkout();
});

window.addEventListener('reset-workout', () => {
  coach.reset();
  document.getElementById('repCount').innerText = "0";
  voice.speak("Counter reset to zero.");
});

// 7. Global Listeners
startBtn.addEventListener('click', startWorkout);
stopBtn.addEventListener('click', stopWorkout);