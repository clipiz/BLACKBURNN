const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

/** ====== SONS D'INTERACTION ======
 * Le système utilise des fichiers audio externes dans `assets/sounds/`.
 * Remplacez simplement les fichiers (mêmes noms) pour personnaliser l'ambiance.
 */
const SOUND_STORAGE_KEY = "blackburn_sound_enabled";
const INTERACTIVE_SOUND_SELECTOR =
  "a[href], button, input[type='button'], input[type='submit'], input[type='reset'], [role='button']";

const soundLibrary = {
  hover: new Audio("assets/sounds/hover.mp3"),
  click: new Audio("assets/sounds/click.mp3"),
  confirm: new Audio("assets/sounds/confirm.mp3")
};

soundLibrary.hover.volume = 0.2;
soundLibrary.click.volume = 0.35;
soundLibrary.confirm.volume = 0.4;
Object.values(soundLibrary).forEach((sound) => {
  sound.preload = "auto";
  sound.load();
});
Object.entries(soundLibrary).forEach(([name, sound]) => {
  sound.addEventListener("error", () => {
    console.warn(`[BLACKBURN] Fichier audio introuvable ou illisible: ${name}`);
  });
});

let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "false";
let userInteractedWithPage = false;

function unlockSoundPlayback() {
  userInteractedWithPage = true;
}

window.addEventListener("pointerdown", unlockSoundPlayback, { once: true, passive: true });
window.addEventListener("keydown", unlockSoundPlayback, { once: true });

/** Joue un son sans bloquer la page si le navigateur refuse la lecture. */
function playSound(soundName) {
  if (!soundEnabled || !userInteractedWithPage) return;

  const source = soundLibrary[soundName];
  if (!source) return;

  // cloneNode évite les coupures quand plusieurs interactions arrivent rapidement.
  const instance = source.cloneNode();
  instance.volume = source.volume;
  instance.currentTime = 0;
  const playPromise = instance.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function bindInteractionSounds() {
  document.querySelectorAll(INTERACTIVE_SOUND_SELECTOR).forEach((element) => {
    if (element.dataset.soundBound === "true") return;

    element.dataset.soundBound = "true";
    element.addEventListener("mouseenter", () => playSound("hover"));
    element.addEventListener("focus", () => playSound("hover"));
    element.addEventListener("click", () => playSound("click"));
  });
}

function setupSoundToggle() {
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "btn sound-toggle";
  toggleBtn.id = "soundToggleBtn";
  toggleBtn.dataset.soundBound = "true";

  function updateSoundToggleUI() {
    toggleBtn.textContent = soundEnabled ? "Sons: ON" : "Sons: OFF";
    toggleBtn.setAttribute("aria-pressed", String(soundEnabled));
  }

  toggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    updateSoundToggleUI();

    if (soundEnabled) {
      playSound("confirm");
    }
  });

  updateSoundToggleUI();
  document.body.appendChild(toggleBtn);
}

setupSoundToggle();
bindInteractionSounds();

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

/** ====== CODE D'ACCÈS ====== */
const ACCESS_CODE = "0000";
const ACCESS_STORAGE_KEY = "blackburn_access_granted";

const gate = document.getElementById("accessGate");
const accessInput = document.getElementById("accessCodeInput");
const accessBtn = document.getElementById("accessCodeBtn");
const accessError = document.getElementById("accessError");

function unlockSite() {
  if (!gate) return;
  gate.classList.add("hidden");
  document.body.classList.remove("locked");
}

function lockSite() {
  if (!gate) return;
  gate.classList.remove("hidden");
  document.body.classList.add("locked");
}

function checkCode() {
  const value = (accessInput?.value || "").trim();
  if (value === ACCESS_CODE) {
    localStorage.setItem(ACCESS_STORAGE_KEY, "true");
    if (accessError) accessError.textContent = "";
    unlockSite();
  } else {
    if (accessError) accessError.textContent = "Code incorrect.";
  }
}

if (gate) {
  const granted = localStorage.getItem(ACCESS_STORAGE_KEY) === "true";
  if (granted) {
    unlockSite();
  } else {
    lockSite();
    accessInput?.focus();
  }

  accessBtn?.addEventListener("click", checkCode);
  accessInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkCode();
  });
}

/** ====== DÉCONNEXION ====== */
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(ACCESS_STORAGE_KEY);
    lockSite();
    if (accessInput) {
      accessInput.value = "";
      accessInput.focus();
    }
    if (accessError) accessError.textContent = "";
  });
}

/** ====== SCROLL REVEAL PREMIUM ====== */
const revealItems = document.querySelectorAll(".reveal-up");

if ("IntersectionObserver" in window && revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add("revealed"));
}
