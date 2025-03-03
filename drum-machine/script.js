class DrumMachine {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.isPlaying = false;
    this.isRecording = false;
    this.currentStep = 0;
    this.tempo = 120;
    this.steps = 16;
    this.currentPattern = 1;
    this.patterns = this.initializePatterns();
    this.sounds = {};
    this.nextStepTime = 0;
    this.recordedPattern = null;
    this.swing = 0;
    this.volume = 0.7;
    this.filter = 1.0;

    this.setupAudio();
    this.initializeUI();
    this.setupEventListeners();
    this.updateDisplay();
    this.setupPixelGrid();
    this.setupKnobs();
    this.startLCDAnimation();
  }

  initializePatterns() {
    const patterns = {};
    for (let i = 1; i <= 4; i++) {
      patterns[i] = {
        kick: new Array(16).fill(false),
        snare: new Array(16).fill(false),
        hihat: new Array(16).fill(false),
        clap: new Array(16).fill(false),
        tom: new Array(16).fill(false),
        cymbal: new Array(16).fill(false),
        perc1: new Array(16).fill(false),
        perc2: new Array(16).fill(false),
      };
    }
    return patterns;
  }

  setupAudio() {
    this.masterGain = this.audioContext.createGain();
    this.masterFilter = this.audioContext.createBiquadFilter();
    this.masterFilter.type = "lowpass";
    this.masterFilter.frequency.value = 20000;

    this.masterGain.connect(this.masterFilter);
    this.masterFilter.connect(this.audioContext.destination);

    this.loadSounds();
  }

  async loadSounds() {
    const sounds = [
      "kick",
      "snare",
      "hihat",
      "clap",
      "tom",
      "cymbal",
      "perc1",
      "perc2",
    ];
    this.samples = {};

    for (const sound of sounds) {
      try {
        const response = await fetch(`sounds/${sound}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        this.samples[sound] = audioBuffer;
      } catch (error) {
        console.error(`Error loading sound: ${sound}`, error);
      }
    }
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
          this.patterns[this.currentPattern][activeSound][step] =
            !this.patterns[this.currentPattern][activeSound][step];
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

    // Pattern navigation
    document.getElementById("prev-pattern").addEventListener("click", () => {
      this.currentPattern = Math.max(1, this.currentPattern - 1);
      this.updateDisplay();
      this.updateGridDisplay();
    });

    document.getElementById("next-pattern").addEventListener("click", () => {
      this.currentPattern = Math.min(4, this.currentPattern + 1);
      this.updateDisplay();
      this.updateGridDisplay();
    });

    // Record button
    document.getElementById("record").addEventListener("click", () => {
      this.isRecording = !this.isRecording;
      document.getElementById("record").classList.toggle("active");
      document.getElementById("status-display").textContent = this.isRecording
        ? "RECORDING"
        : "READY";
    });

    // Save/Load pattern
    document.getElementById("save-pattern").addEventListener("click", () => {
      const patternData = JSON.stringify(this.patterns);
      localStorage.setItem("drumPatterns", patternData);
      document.getElementById("status-display").textContent = "SAVED";
      setTimeout(() => {
        document.getElementById("status-display").textContent = this.isPlaying
          ? "PLAYING"
          : "READY";
      }, 1000);
    });

    document.getElementById("load-pattern").addEventListener("click", () => {
      const savedPatterns = localStorage.getItem("drumPatterns");
      if (savedPatterns) {
        this.patterns = JSON.parse(savedPatterns);
        this.updateGridDisplay();
        document.getElementById("status-display").textContent = "LOADED";
        setTimeout(() => {
          document.getElementById("status-display").textContent = this.isPlaying
            ? "PLAYING"
            : "READY";
        }, 1000);
      }
    });
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
    if (!this.samples[sound]) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = this.samples[sound];
    gainNode.gain.value = this.volume * (0.7 + Math.random() * 0.3);

    source.connect(gainNode);
    gainNode.connect(this.masterFilter);

    source.start(0);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    document.getElementById("play").classList.add("active");
    document.getElementById("status-display").textContent = "PLAYING";

    this.scheduleNextStep();
  }

  stop() {
    this.isPlaying = false;
    document.getElementById("play").classList.remove("active");
    document.getElementById("status-display").textContent = "STOPPED";
  }

  scheduleNextStep() {
    if (!this.isPlaying) return;

    const currentPattern = this.patterns[this.currentPattern];
    Object.entries(currentPattern).forEach(([sound, steps]) => {
      if (steps[this.currentStep]) {
        this.playSound(sound);
      }
    });

    this.updateStepIndicators();

    this.currentStep = (this.currentStep + 1) % 16;

    const swingOffset = this.currentStep % 2 === 1 ? this.swing * 0.1 : 0;
    const nextStepTime = 60 / this.tempo / 4 + swingOffset;

    setTimeout(() => this.scheduleNextStep(), nextStepTime * 1000);
  }

  updateGridDisplay() {
    document.querySelectorAll(".grid-cell").forEach((cell, index) => {
      const step = parseInt(cell.dataset.step);
      const activeSound = this.getActiveSound();
      if (activeSound) {
        cell.classList.toggle(
          "active",
          this.patterns[this.currentPattern][activeSound][step]
        );
      }
      cell.classList.toggle("current", step === this.currentStep);
    });
  }

  generateRandomPattern() {
    const activeSound = this.getActiveSound();
    if (activeSound) {
      this.patterns[this.currentPattern][activeSound] = this.patterns[
        this.currentPattern
      ][activeSound].map(() => Math.random() > 0.7);
      this.updateGridDisplay();
    }
  }

  enhancePattern() {
    const activeSound = this.getActiveSound();
    if (activeSound) {
      // Simple AI enhancement: Add some variation to the pattern
      const pattern = [...this.patterns[this.currentPattern][activeSound]];
      for (let i = 0; i < pattern.length; i++) {
        if (Math.random() > 0.8) {
          pattern[i] = !pattern[i];
        }
      }
      this.patterns[this.currentPattern][activeSound] = pattern;
      this.updateGridDisplay();
    }
  }

  updateDisplay() {
    document.getElementById("bpm-display").textContent = `BPM: ${Math.round(
      this.tempo
    )}`;
    document.getElementById(
      "pattern-display"
    ).textContent = `PATTERN: ${this.currentPattern}`;
    document.getElementById(
      "pattern-number"
    ).textContent = `Pattern ${this.currentPattern}`;
  }

  updateStepIndicators() {
    const indicators = document.querySelectorAll(".step-indicator");
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === this.currentStep);
    });
  }

  setVolume(value) {
    this.volume = value;
    this.masterGain.gain.value = value;
  }

  setTempo(value) {
    this.tempo = value;
    this.updateDisplay();
  }

  setSwing(value) {
    this.swing = value;
  }

  setFilter(value) {
    this.filter = value;
    this.masterFilter.frequency.value = 200 + value * 19800;
  }

  previousPattern() {
    this.currentPattern = Math.max(1, this.currentPattern - 1);
    this.updateDisplay();
  }

  nextPattern() {
    this.currentPattern = Math.min(4, this.currentPattern + 1);
    this.updateDisplay();
  }

  savePatterns() {
    localStorage.setItem("drumPatterns", JSON.stringify(this.patterns));
    document.getElementById("status-display").textContent = "SAVED";
    setTimeout(() => this.updateDisplay(), 1000);
  }

  loadPatterns() {
    const saved = localStorage.getItem("drumPatterns");
    if (saved) {
      this.patterns = JSON.parse(saved);
      document.getElementById("status-display").textContent = "LOADED";
      setTimeout(() => this.updateDisplay(), 1000);
    }
  }

  clearPattern() {
    this.patterns[this.currentPattern] = Object.fromEntries(
      Object.keys(this.patterns[this.currentPattern]).map((key) => [
        key,
        new Array(16).fill(false),
      ])
    );
    document.getElementById("status-display").textContent = "CLEARED";
    setTimeout(() => this.updateDisplay(), 1000);
  }

  setupPixelGrid() {
    const grid = document.querySelector(".pixel-grid");
    for (let i = 0; i < 128; i++) {
      const pixel = document.createElement("div");
      pixel.className = "pixel";
      grid.appendChild(pixel);
    }
    this.updatePixelGrid();
  }

  setupKnobs() {
    const knobs = document.querySelectorAll(".knob");
    knobs.forEach((knob) => {
      let isDragging = false;
      let startY;
      let startValue;

      knob.addEventListener("mousedown", (e) => {
        isDragging = true;
        startY = e.clientY;
        startValue = this[knob.id.replace("-knob", "")] || 0;
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const deltaY = startY - e.clientY;
        const newValue = Math.min(Math.max(startValue + deltaY / 100, 0), 1);

        switch (knob.id) {
          case "volume-knob":
            this.setVolume(newValue);
            break;
          case "tempo-knob":
            this.setTempo(60 + newValue * 140);
            break;
          case "swing-knob":
            this.setSwing(newValue);
            break;
          case "filter-knob":
            this.setFilter(newValue);
            break;
        }

        knob.style.transform = `rotate(${newValue * 270 - 135}deg)`;
      });

      document.addEventListener("mouseup", () => {
        isDragging = false;
      });
    });
  }

  startLCDAnimation() {
    setInterval(() => {
      this.updatePixelGrid();
    }, 100);
  }

  updatePixelGrid() {
    const pixels = document.querySelectorAll(".pixel");
    pixels.forEach((pixel) => {
      if (Math.random() > 0.9) {
        pixel.classList.toggle("active");
      }
    });
  }
}

// Initialize the drum machine when the page loads
window.addEventListener("load", () => {
  const drumMachine = new DrumMachine();
});
