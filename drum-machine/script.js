<<<<<<< HEAD
class DrumMachine {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.isPlaying = false;
    this.currentStep = 0;
    this.tempo = 120;
    this.steps = 16;
    this.pattern = this.createEmptyPattern();
    this.sounds = {};
    this.nextStepTime = 0;

    this.initializeSounds();
    this.initializeUI();
    this.setupEventListeners();
  }

  async initializeSounds() {
    const soundFiles = {
      kick: "https://raw.githubusercontent.com/username/drum-samples/main/kick.mp3",
      snare:
        "https://raw.githubusercontent.com/username/drum-samples/main/snare.mp3",
      hihat:
        "https://raw.githubusercontent.com/username/drum-samples/main/hihat.mp3",
      clap: "https://raw.githubusercontent.com/username/drum-samples/main/clap.mp3",
      tom: "https://raw.githubusercontent.com/username/drum-samples/main/tom.mp3",
      cymbal:
        "https://raw.githubusercontent.com/username/drum-samples/main/cymbal.mp3",
    };

    // Fallback sounds if the main ones fail to load
    const fallbackSounds = {
      kick: "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
      snare:
        "https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3",
      hihat:
        "https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3",
      clap: "https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3",
      tom: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
      cymbal:
        "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
    };

    for (const [name, url] of Object.entries(soundFiles)) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load main sound");
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        this.sounds[name] = audioBuffer;
      } catch (error) {
        console.log(`Loading fallback sound for ${name}`);
        try {
          const response = await fetch(fallbackSounds[name]);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(
            arrayBuffer
          );
          this.sounds[name] = audioBuffer;
        } catch (fallbackError) {
          console.error(`Error loading sound ${name}:`, fallbackError);
        }
      }
    }
  }

  createEmptyPattern() {
    const sounds = ["kick", "snare", "hihat", "clap", "tom", "cymbal"];
    return sounds.reduce((acc, sound) => {
      acc[sound] = new Array(this.steps).fill(false);
      return acc;
    }, {});
  }

  initializeUI() {
    // Create pattern grid
    const grid = document.getElementById("pattern-grid");
    for (let i = 0; i < this.steps; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.step = i;
      grid.appendChild(cell);
    }

    // Update tempo display
    document.getElementById("tempo-value").textContent = this.tempo;
  }

  setupEventListeners() {
    // Pad clicks
    document.querySelectorAll(".pad").forEach((pad) => {
      pad.addEventListener("click", () => {
        const sound = pad.dataset.sound;
        this.playSound(sound);
        this.activatePad(pad);
      });
    });

    // Pattern grid clicks
    document.getElementById("pattern-grid").addEventListener("click", (e) => {
      if (e.target.classList.contains("grid-cell")) {
        const step = parseInt(e.target.dataset.step);
        const activeSound = this.getActiveSound();
        if (activeSound) {
          this.pattern[activeSound][step] = !this.pattern[activeSound][step];
          e.target.classList.toggle("active");
        }
      }
    });

    // Transport controls
    document
      .getElementById("play")
      .addEventListener("click", () => this.togglePlay());
    document
      .getElementById("stop")
      .addEventListener("click", () => this.stop());

    // Tempo control
    document.getElementById("tempo").addEventListener("input", (e) => {
      this.tempo = parseInt(e.target.value);
      document.getElementById("tempo-value").textContent = this.tempo;
      if (this.isPlaying) {
        this.stop();
        this.play();
      }
    });

    // Random pattern
    document
      .getElementById("random-pattern")
      .addEventListener("click", () => this.generateRandomPattern());

    // AI enhance
    document
      .getElementById("ai-enhance")
      .addEventListener("click", () => this.enhancePattern());
  }

  getActiveSound() {
    const activePad = document.querySelector(".pad.active");
    return activePad ? activePad.dataset.sound : null;
  }

  activatePad(pad) {
    document
      .querySelectorAll(".pad")
      .forEach((p) => p.classList.remove("active"));
    pad.classList.add("active");
  }

  playSound(sound) {
    if (this.sounds[sound]) {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.sounds[sound];
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      document.getElementById("play").classList.add("active");
      this.nextStepTime = 0;
      this.scheduleNextStep();
    }
  }

  stop() {
    this.isPlaying = false;
    document.getElementById("play").classList.remove("active");
    this.currentStep = 0;
    this.nextStepTime = 0;
    this.updateGridDisplay();
  }

  scheduleNextStep() {
    if (!this.isPlaying) return;

    const stepTime = 60 / this.tempo / 4; // 16th note
    const now = this.audioContext.currentTime;

    if (this.nextStepTime === 0) {
      this.nextStepTime = now;
    } else {
      this.nextStepTime += stepTime;
    }

    this.playCurrentStep();
    this.currentStep = (this.currentStep + 1) % this.steps;
    this.updateGridDisplay();

    const timeUntilNextStep = this.nextStepTime - now;
    setTimeout(() => this.scheduleNextStep(), timeUntilNextStep * 1000);
  }

  playCurrentStep() {
    Object.entries(this.pattern).forEach(([sound, steps]) => {
      if (steps[this.currentStep]) {
        this.playSound(sound);
      }
    });
  }

  updateGridDisplay() {
    document.querySelectorAll(".grid-cell").forEach((cell, index) => {
      const step = parseInt(cell.dataset.step);
      const activeSound = this.getActiveSound();
      if (activeSound) {
        cell.classList.toggle("active", this.pattern[activeSound][step]);
      }
      cell.classList.toggle("current", step === this.currentStep);
    });
  }

  generateRandomPattern() {
    const activeSound = this.getActiveSound();
    if (activeSound) {
      this.pattern[activeSound] = this.pattern[activeSound].map(
        () => Math.random() > 0.7
      );
      this.updateGridDisplay();
    }
  }

  enhancePattern() {
    const activeSound = this.getActiveSound();
    if (activeSound) {
      // Simple AI enhancement: Add some variation to the pattern
      const pattern = [...this.pattern[activeSound]];
      for (let i = 0; i < pattern.length; i++) {
        if (Math.random() > 0.8) {
          pattern[i] = !pattern[i];
        }
      }
      this.pattern[activeSound] = pattern;
      this.updateGridDisplay();
    }
  }
}

// Initialize the drum machine when the page loads
window.addEventListener("load", () => {
  const drumMachine = new DrumMachine();
});
=======
function timeUntilNextBirthday(birthYear, birthMonth, birthDay) {
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);

    if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
    }

    const timeDiff = nextBirthday - today;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `تا تولد بعدی شما (${birthYear}-${birthMonth}-${birthDay})، ${days} روز، ${hours} ساعت و ${minutes} دقیقه باقی مانده است.`;
}

console.log(timeUntilNextBirthday(1988, 9, 21));
>>>>>>> 66dee5a569ad0669c9805ea34508fc1634624189
