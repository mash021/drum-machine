document.addEventListener("DOMContentLoaded", () => {
  // تنظیم ولوم‌ها
  const knobs = document.querySelectorAll(".knob");
  const knobValues = {
    volume: 50,
    tone: 50,
    effect: 0,
    mix: 50,
  };

  knobs.forEach((knob) => {
    let rotation = 0;
    let isDragging = false;
    let startY;
    const knobId = knob.id;

    knob.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", () => {
        isDragging = false;
        document.removeEventListener("mousemove", handleDrag);
      });
    });

    function handleDrag(e) {
      if (!isDragging) return;
      const deltaY = startY - e.clientY;
      rotation = Math.min(270, Math.max(0, rotation + deltaY * 0.5));
      knob.style.transform = `rotate(${rotation}deg)`;
      knob.querySelector(
        "::after"
      ).style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      knobValues[knobId] = Math.round((rotation / 270) * 100);
      startY = e.clientY;

      // نمایش مقدار در LCD
      updateLCDDisplay();
    }
  });

  function updateLCDDisplay() {
    const lcdScreen = document.querySelector(".lcd-screen");
    lcdScreen.innerHTML = `
      <div style="color: #222; padding: 10px; font-family: monospace;">
        VOL: ${knobValues.volume}  TNE: ${knobValues.tone}
        EFX: ${knobValues.effect}  MIX: ${knobValues.mix}
      </div>
    `;
  }

  // پد‌ها
  const pads = document.querySelectorAll(".pad");
  pads.forEach((pad) => {
    pad.addEventListener("mousedown", () => {
      pad.style.backgroundColor = "#ff3e3e";
      pad.style.boxShadow = "0 0 10px #ff3e3e";
    });

    pad.addEventListener("mouseup", () => {
      pad.style.backgroundColor = "#666";
      pad.style.boxShadow = "none";
    });

    pad.addEventListener("mouseleave", () => {
      pad.style.backgroundColor = "#666";
      pad.style.boxShadow = "none";
    });
  });

  // دکمه‌های کنترل
  const buttons = document.querySelectorAll(".ctrl-btn");
  buttons.forEach((button) => {
    button.addEventListener("mousedown", () => {
      button.style.backgroundColor = "#555";
    });

    button.addEventListener("mouseup", () => {
      button.style.backgroundColor = "#333";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#333";
    });
  });

  // نمایش اولیه در LCD
  updateLCDDisplay();
});
