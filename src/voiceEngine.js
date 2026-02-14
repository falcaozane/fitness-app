export class VoiceEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.initRecognition();
  }

  speak(text) {
    if (this.synth.speaking) this.synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    this.synth.speak(utter);
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      this.handleVoiceCommand(transcript);
    };

    this.recognition.onend = () => this.recognition.start();
  }

  startListening() {
    try {
      if (this.recognition) this.recognition.start();
    } catch (e) { console.log("Recognition already active"); }
  }

  handleVoiceCommand(text) {
    console.log("Coach heard:", text);

    if (text.includes("i can't do more") || text.includes("too tired")) {
      this.speak("Just try for a few more, you can do it!");
    } 
    else if (text.includes("not possible") || text.includes("stop workout")) {
      // Dispatches a custom event so main.js knows to stop
      window.dispatchEvent(new CustomEvent('voice-stop-request'));
    }
    else if (text.includes("reset")) {
      window.dispatchEvent(new CustomEvent('reset-workout'));
    }
  }
}