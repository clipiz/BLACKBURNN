const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

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
