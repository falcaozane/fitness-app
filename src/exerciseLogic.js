export class ExerciseCoach {
    constructor() {
        this.reps = 0;
        this.state = "up"; // "up" or "down"
    }

    // Helper to calculate angle between 3 points
    calculateAngle(p1, p2, p3) {
        const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    }

    processPose(landmarks, exercise) {
        // Landmarks: 12: shoulder, 14: elbow, 16: wrist, 24: hip, 26: knee, 28: ankle
        const angles = {
            knee: this.calculateAngle(landmarks[24], landmarks[26], landmarks[28]),
            hip: this.calculateAngle(landmarks[12], landmarks[24], landmarks[26]),
            arm: this.calculateAngle(landmarks[12], landmarks[14], landmarks[16])
        };

        if (exercise === 'squat') {
            this.handleSquatLogic(angles);
        } else if (exercise === 'pushup') {
            this.handlePushupLogic(angles);
        }

        return { ...angles, reps: this.reps, state: this.state };
    }

    handleSquatLogic(angles) {
        // Squat: Go down below 90, back up above 160
        if (angles.knee < 95 && this.state === "up") {
            this.state = "down";
        }
        if (angles.knee > 160 && this.state === "down") {
            this.state = "up";
            this.reps++;
            this.playDing();
        }
    }

    handlePushupLogic(angles) {
        // Pushup: Arm angle goes from 160+ (up) to < 90 (down)
        if (angles.arm < 90 && this.state === "up") {
            this.state = "down";
        }
        if (angles.arm > 160 && this.state === "down") {
            this.state = "up";
            this.reps++;
            this.playDing();
        }
    }

    playDing() {
        // Optional: Add a simple beep audio here
    }

    reset() {
        this.reps = 0;
        this.state = "up";
    }
}