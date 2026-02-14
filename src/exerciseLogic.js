export class ExerciseCoach {
    constructor() {
        this.reps = 0;
        this.state = "up"; // Matches your initial state
    }

    // Matches your OG angle function
    calculateAngle(a, b, c) {
        const ab = { x: a.x - b.x, y: a.y - b.y };
        const cb = { x: c.x - b.x, y: c.y - b.y };
        const dot = ab.x * cb.x + ab.y * cb.y;
        const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
        if (mag === 0) return 0;
        return Math.acos(dot / mag) * 180 / Math.PI;
    }

    // Matches your OG verticalAngle function
    calculateVerticalAngle(a, b) {
        const seg = { x: a.x - b.x, y: a.y - b.y };
        const vertical = { x: 0, y: -1 };
        const dot = seg.x * vertical.x + seg.y * vertical.y;
        const mag = Math.hypot(seg.x, seg.y);
        if (mag === 0) return 0;
        return Math.acos(dot / mag) * 180 / Math.PI;
    }

    processPose(lm, exercise) {
        // Mapping landmarks to your OG variables
        const shoulder = lm[12];
        const elbow = lm[14];
        const wrist = lm[16];
        const hip = lm[24];
        const knee = lm[26];
        const ankle = lm[28];
        const nose = lm[0];

        const angles = {
            kneeAngle: this.calculateAngle(hip, knee, ankle),
            hipAngle: this.calculateAngle(shoulder, hip, knee),
            legAngle: this.calculateVerticalAngle(ankle, hip),
            chestAngle: this.calculateVerticalAngle(shoulder, hip),
            absAngle: this.calculateVerticalAngle(hip, shoulder),
            handAngle: this.calculateAngle(shoulder, elbow, wrist),
            neckAngle: this.calculateVerticalAngle(nose, shoulder)
        };

        // EXACT SQUAT LOGIC from your OG code
        if (exercise === "squat") {
            if (angles.kneeAngle > 165 && angles.hipAngle > 130 && this.state === "up") {
                this.state = "down";
            }
            if (angles.kneeAngle < 95 && angles.hipAngle < 80 && this.state === "down") {
                this.state = "up";
                this.reps++;
            }
        }

        // EXACT PUSH-UP LOGIC from your OG code
        if (exercise === "pushup") {
            if (angles.handAngle > 160 && this.state === "up") {
                this.state = "down";
            }
            if (angles.handAngle < 90 && this.state === "down") {
                this.state = "up";
                this.reps++;
            }
        }

        return { ...angles, reps: this.reps, state: this.state };
    }

    reset() {
        this.reps = 0;
        this.state = "up";
    }
}