import { ExerciseCoach } from './exerciseLogic.js';
import { VoiceEngine } from './voiceEngine.js';

// Initialize our Modules
const coach = new ExerciseCoach();
const voice = new VoiceEngine();

// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const exerciseSelect = document.getElementById('exerciseSelect');
const repDisplay = document.getElementById('repCount');

let camera = null;

// 1. MediaPipe Pose Setup
const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// 2. Detection Logic
pose.onResults((results) => {
    if (!results.poseLandmarks) return;

    // Adjust canvas to match video stream dimensions
    if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // --- RENDER ---
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    // Visual feedback (Skeletal overlay)
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#10b981', lineWidth: 4 });
    drawLandmarks(ctx, results.poseLandmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });
    ctx.restore();

    // --- BUSINESS LOGIC ---
    const currentExercise = exerciseSelect.value;
    const prevReps = coach.reps;
    
    // Process angles and counting via the Coach module
    const stats = coach.processPose(results.poseLandmarks, currentExercise);

    // Rep Counting Voice Feedback
    if (stats.reps > prevReps) {
        voice.speak(stats.reps.toString());
    }

    // UI Updates
    updateDashboard(stats);
});

// 3. UI Helper
function updateDashboard(stats) {
    repDisplay.innerText = stats.reps;
    document.getElementById('stat-knee').innerText = `${Math.round(stats.knee)}°`;
    document.getElementById('stat-hip').innerText = `${Math.round(stats.hip)}°`;
    document.getElementById('stat-arm').innerText = `${Math.round(stats.arm)}°`;
    
    const stateEl = document.getElementById('stat-state');
    stateEl.innerText = stats.state.toUpperCase();
    stateEl.style.color = stats.state === 'down' ? '#fbbf24' : '#10b981'; // Yellow for down, Green for up
}

// 4. Session Controls
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
        alert("Camera error. Please ensure permissions are granted.");
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

// 5. Voice Interaction Listeners
// These listen for custom events dispatched from voiceEngine.js
window.addEventListener('voice-stop-request', () => {
    // This handles "not possible" or "stop workout"
    voice.speak(`Alright, don't hurt yourself. You've already done ${coach.reps} reps!`);
    stopWorkout();
});

window.addEventListener('reset-workout', () => {
    coach.reset();
    repDisplay.innerText = "0";
    voice.speak("Counter reset to zero.");
});

// 6. Global Event Listeners
startBtn.addEventListener('click', startWorkout);
stopBtn.addEventListener('click', stopWorkout);