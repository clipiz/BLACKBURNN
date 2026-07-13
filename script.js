const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const gate = document.getElementById("accessGate");
const accessInput = document.getElementById("accessCodeInput");
const accessBtn = document.getElementById("accessCodeBtn");
const accessError = document.getElementById("accessError");

/** ====== WIDGETS GLOBAUX ======
 * Ajustez simplement ces constantes pour faire évoluer le statut affiché
 * et les logs esthétiques du terminal sur toutes les pages.
 */
const UNIT_STATUS = "OPÉRATIF";
const DISCORD_INVITE_URL = "https://discord.gg/U8Xu5EEEsD";
const WARNING_STATUS_KEYWORDS = ["alerte", "maintenance", "veille"];
const CRITICAL_STATUS_KEYWORDS = ["hors service", "offline", "inactif"];
const TERMINAL_BOOT_LOGS = [
  "> ACCESS_TERMINAL_READY",
  "> AUTHENTIFICATION REQUISE",
  "> ENTREZ CODE D'ACCÈS..."
];

/** ====== SONS D'INTERACTION ======
 * Le système utilise des fichiers audio externes dans `assets/sounds/`.
 * Remplacez simplement les fichiers (mêmes noms) pour personnaliser l'ambiance.
 */
const SOUND_STORAGE_KEY = "blackburn_sound_enabled";
const INTERACTIVE_SOUND_SELECTOR =
  "a[href], button, input[type='button'], input[type='submit'], input[type='reset'], [role='button']";

const soundDefinitions = {
  hover: { src: "assets/sounds/hover.mp3", volume: 0.2 },
  click: { src: "assets/sounds/click.mp3", volume: 0.35 },
  confirm: { src: "assets/sounds/confirm.mp3", volume: 0.4 }
};
let soundLibrary;

function getSoundLibrary() {
  if (soundLibrary) return soundLibrary;

  soundLibrary = {};
  Object.entries(soundDefinitions).forEach(([name, config]) => {
    const sound = new Audio(config.src);
    sound.preload = "auto";
    sound.volume = config.volume;
    sound.addEventListener("error", () => {
      console.warn(`[BLACKBURN] Fichier audio introuvable ou illisible: ${config.src}`);
    });
    soundLibrary[name] = sound;
  });
  return soundLibrary;
}

function preloadSounds() {
  Object.values(getSoundLibrary()).forEach((sound) => sound.load());
}

let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "false";
let userInteractedWithPage = false;

/** ====== MUSIQUE DE FOND ======
 * Un unique fichier `assets/sounds/background.mp3` joué en boucle discrète.
 * Démarre seulement après une interaction utilisateur (politique autoplay des navigateurs)
 * et respecte le même interrupteur ON/OFF que les sons d'interaction.
 */
const BACKGROUND_MUSIC_SRC = "assets/sounds/background.mp3";
const BACKGROUND_MUSIC_VOLUME = 0.15;
let backgroundMusic;

function getBackgroundMusic() {
  if (backgroundMusic) return backgroundMusic;

  backgroundMusic = new Audio(BACKGROUND_MUSIC_SRC);
  backgroundMusic.preload = "auto";
  backgroundMusic.loop = true;
  backgroundMusic.volume = BACKGROUND_MUSIC_VOLUME;
  backgroundMusic.addEventListener("error", () => {
    console.warn(`[BLACKBURN] Fichier audio introuvable ou illisible: ${BACKGROUND_MUSIC_SRC}`);
  });
  return backgroundMusic;
}

function playBackgroundMusic() {
  if (!soundEnabled) return;

  const music = getBackgroundMusic();
  if (!music.paused) return;

  const playPromise = music.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function stopBackgroundMusic() {
  if (!backgroundMusic) return;
  backgroundMusic.pause();
}

function unlockSoundPlayback() {
  userInteractedWithPage = true;
  if (soundEnabled) {
    preloadSounds();
    playBackgroundMusic();
  }
}

window.addEventListener("pointerdown", unlockSoundPlayback, { once: true, passive: true });
window.addEventListener("keydown", unlockSoundPlayback, { once: true });

/** Joue un son sans bloquer la page si le navigateur refuse la lecture. */
function playSound(soundName) {
  if (!soundEnabled || !userInteractedWithPage) return;

  const source = getSoundLibrary()[soundName];
  if (!source) return;

  // Si un son est déjà en cours, on clone pour éviter les artefacts audio.
  const playbackInstance = !source.paused ? new Audio(source.src) : source;
  playbackInstance.volume = source.volume;
  if (playbackInstance === source) {
    source.currentTime = 0;
  }

  const playPromise = playbackInstance.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function getInteractiveElement(target) {
  if (!(target instanceof Element)) return null;
  return target.closest(INTERACTIVE_SOUND_SELECTOR);
}

function setupInteractionSoundDelegation() {
  document.addEventListener("mouseover", (event) => {
    const interactiveTarget = getInteractiveElement(event.target);
    if (!interactiveTarget || interactiveTarget.id === "soundToggleBtn") return;

    const previousTarget = getInteractiveElement(event.relatedTarget);
    if (previousTarget === interactiveTarget) return;
    playSound("hover");
  });

  document.addEventListener("focusin", (event) => {
    const interactiveTarget = getInteractiveElement(event.target);
    if (!interactiveTarget || interactiveTarget.id === "soundToggleBtn") return;
    playSound("hover");
  });

  document.addEventListener("click", (event) => {
    const interactiveTarget = getInteractiveElement(event.target);
    if (!interactiveTarget || interactiveTarget.id === "soundToggleBtn") return;
    playSound("click");
  });
}

function setupSoundToggle() {
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "btn sound-toggle";
  toggleBtn.id = "soundToggleBtn";

  function updateSoundToggleUI() {
    toggleBtn.textContent = soundEnabled ? "Sons: ON" : "Sons: OFF";
    toggleBtn.setAttribute("aria-pressed", String(soundEnabled));
  }

  toggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    updateSoundToggleUI();

    if (soundEnabled) {
      preloadSounds();
      playSound("confirm");
      if (userInteractedWithPage) playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  });

  updateSoundToggleUI();
  document.body.appendChild(toggleBtn);
}

/** ====== STATUS TRACKER + ACCÈS DISCORD ======
 * Insertion dynamique pour garder un rendu cohérent sur toutes les pages
 * sans dupliquer le même HTML.
 */
function normalizeTerminalText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getUnitStatusTone(status) {
  const normalizedStatus = normalizeTerminalText(status);

  if (WARNING_STATUS_KEYWORDS.some((keyword) => normalizedStatus.includes(keyword))) {
    return "warning";
  }

  if (CRITICAL_STATUS_KEYWORDS.some((keyword) => normalizedStatus.includes(keyword))) {
    return "critical";
  }

  return "operational";
}

function setupSiteUtilities() {
  const utilities = document.querySelector(".site-utilities") || document.createElement("div");
  utilities.className = "site-utilities";
  utilities.replaceChildren();

  const statusWidget = document.createElement("div");
  statusWidget.className = "unit-status";
  statusWidget.dataset.statusTone = getUnitStatusTone(UNIT_STATUS);
  statusWidget.innerHTML = `
    <span class="status-led" aria-hidden="true"></span>
    <span class="status-label">STATUT DE L'UNITÉ : ${UNIT_STATUS}</span>
  `;

  const discordLink = document.createElement("a");
  discordLink.className = "btn discord-link";
  discordLink.href = DISCORD_INVITE_URL;
  discordLink.target = "_blank";
  discordLink.rel = "noopener noreferrer";
  discordLink.textContent = "Discord";
  discordLink.setAttribute("aria-label", "Rejoindre le Discord BLACKBURN");

  utilities.append(statusWidget, discordLink);
  if (!utilities.isConnected) {
    document.body.appendChild(utilities);
  }
}

/** ====== HABILLAGE TERMINAL / CRT ======
 * Ajoute des lignes de terminal esthétiques dans l'écran d'accès
 * sans alourdir le HTML de chaque page.
 */
function setupAccessGateTerminal() {
  const gateBox = gate?.querySelector(".gate-box");
  const gateIntro = gateBox?.querySelector("p");

  if (!gateBox || !gateIntro || gateBox.querySelector(".gate-terminal-log")) return;

  const terminalLog = document.createElement("div");
  terminalLog.className = "gate-terminal-log";

  TERMINAL_BOOT_LOGS.forEach((line) => {
    const terminalLine = document.createElement("div");
    terminalLine.className = "gate-terminal-line";
    terminalLine.textContent = line;
    terminalLog.appendChild(terminalLine);
  });

  gateIntro.insertAdjacentElement("afterend", terminalLog);
}

setupSiteUtilities();
setupSoundToggle();
setupInteractionSoundDelegation();
setupAccessGateTerminal();

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
