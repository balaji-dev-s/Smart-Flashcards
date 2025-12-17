import { Storage } from "./storage.js";

// ----------------------------
// HELPER SHORTCUTS
// ----------------------------
const qs = sel => document.querySelector(sel); // shortcut for document.querySelector
const pad = n => String(n).padStart(2, "0"); // pad number with 0 if less than 10

// ----------------------------
// GET DECK ID FROM URL
// ----------------------------
const urlParams = new URLSearchParams(window.location.search);
const deckId = urlParams.get("id");

// ----------------------------
// GET DOM ELEMENTS
// ----------------------------
const titleEl = qs("#deckTitleDetail");
const subtitleEl = qs("#deckSubtitleDetail");
const trackMessage = qs("#trackMessage");
const cardsContainer = qs("#cardsContainerDetail");
const prevBtn = qs("#prevBtn");
const nextBtn = qs("#nextBtn");
const markBtn = qs("#markBtn");
const learnedCountEl = qs("#learnedCount");
const unlearnedCountEl = qs("#unlearnedCount");
const positionCounter = qs("#positionCounter");
const trackToggle = qs("#trackToggle");
const progressWrap = qs("#progressWrap");
const progressFill = qs("#progressFill");
const timerDisplay = qs("#timerDisplay");
const overlay = qs("#completionOverlay");
const goHomeUrl = "/";

// ----------------------------
// LOAD DECK DATA FROM STORAGE
// ----------------------------
const deck = Storage.getDeckById(deckId);
if (!deck) throw new Error("Deck not found");

// make sure each card has default learned and difficulty values
deck.cards.forEach(c => {
  if (typeof c.learned === "undefined") c.learned = false;
  if (typeof c.difficulty === "undefined") c.difficulty = null;
});

// ----------------------------
// LOCAL STORAGE KEYS
// ----------------------------
const TIMER_KEY = `flash_timer_${deckId}`; // key to save timer
const DECK_KEY = `flash_deck_override_${deckId}`; // key to save progress (learned/difficulty)
const COMPLETED_KEY = `deck_completed_${deckId}`; // key to mark deck completed

// ----------------------------
// LOAD SAVED PROGRESS IF AVAILABLE
// ----------------------------
const savedOverride = localStorage.getItem(DECK_KEY);
if (savedOverride) {
  try {
    const override = JSON.parse(savedOverride);
    if (Array.isArray(override.cards)) {
      override.cards.forEach((oc, idx) => {
        if (deck.cards[idx]) {
          if (typeof oc.learned !== "undefined") deck.cards[idx].learned = !!oc.learned;
          if (typeof oc.difficulty !== "undefined") deck.cards[idx].difficulty = oc.difficulty || null;
        }
      });
    }
  } catch (e) { console.warn("invalid saved deck override", e); }
}

// ----------------------------
// GLOBAL STATE VARIABLES
// ----------------------------
let currentIndex = 0; // current card index
let timerInterval = null; // for setInterval
let elapsedSeconds = parseInt(localStorage.getItem(TIMER_KEY) || "0", 10) || 0;

// ----------------------------
// HELPER FUNCTION TO FORMAT TIME
// ----------------------------
function formatTime(sec) {
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${pad(mm)}:${pad(ss)}`;
}

// ----------------------------
// TIMER FUNCTIONS
// ----------------------------
function startTimer() {
  if (timerInterval) return; // don't start if already running
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    timerDisplay.innerText = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  localStorage.setItem(TIMER_KEY, String(elapsedSeconds)); // save timer
}

// ----------------------------
// SAVE CURRENT PROGRESS
// ----------------------------
function saveDeckOverride() {
  const toSave = { cards: deck.cards.map(c => ({ learned: !!c.learned, difficulty: c.difficulty || null })) };
  try { localStorage.setItem(DECK_KEY, JSON.stringify(toSave)); } catch (e) { console.warn(e); }
}

// ----------------------------
// ESCAPE HTML TO PREVENT CODE INJECTION
// ----------------------------
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ----------------------------
// UPDATE LEARNED/UNLEARNED COUNTS
// ----------------------------
function updateCounts() {
  const learned = deck.cards.filter(c => c.learned).length;
  const total = deck.cards.length;
  learnedCountEl.innerText = String(learned).padStart(2, "0");
  unlearnedCountEl.innerText = String(total - learned).padStart(2, "0");

  if (trackToggle.checked) updateProgressFill(); // update progress bar
  if (deck.cards.every(c => c.learned) && trackToggle.checked) markDeckCompleted(); // check if all done
}

// ----------------------------
// UPDATE PROGRESS BAR
// ----------------------------
function updateProgressFill() {
  if (!trackToggle.checked) { 
    progressWrap.setAttribute("aria-hidden", "true"); 
    return; 
  }
  progressWrap.setAttribute("aria-hidden", "false");
  const learned = deck.cards.filter(c => c.learned).length;
  progressFill.style.width = Math.round((learned / deck.cards.length) * 100) + "%";
}

// ----------------------------
// RENDER CURRENT CARD
// ----------------------------
function renderCard() {
  if (!deck.cards.length) { 
    cardsContainer.innerHTML = "<div>No cards</div>"; 
    positionCounter.innerText = "0/0"; 
    return; 
  }

  // ensure currentIndex is within bounds
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= deck.cards.length) currentIndex = deck.cards.length - 1;

  const card = deck.cards[currentIndex];
  cardsContainer.innerHTML = "";
  const cardDiv = document.createElement("div");
  cardDiv.className = "flip-card";
  if (card.learned) cardDiv.classList.add("learned");
  if (card.difficulty) cardDiv.dataset.diff = card.difficulty;

  cardDiv.innerHTML = `
    <div class="flip-card-inner">
      <div class="flip-card-front">
        <div class="card-top-buttons"></div>
        <p class="fs-4"><strong></strong> ${escapeHtml(card.question)}</p>
        <p>(Tap to reveal answer)</p>
      </div>
      <div class="flip-card-back">
        <div class="card-top-buttons"></div>
        <h4>Answer</h4>
        <p class="fs-4">${escapeHtml(card.answer)}</p>
      </div>
    </div>
  `;

  // flip card when clicking on it
  cardDiv.addEventListener("click", e => {
    if (e.target === markBtn || e.target.closest(".arrow-btn") || e.target.closest(".card-top-buttons")) return;
    cardDiv.classList.toggle("flipped");
  });

  cardsContainer.appendChild(cardDiv);

  // add easy/hard buttons on top
  cardDiv.querySelectorAll(".card-top-buttons").forEach(container => {
    ["easy", "hard"].forEach(type => {
      const btn = document.createElement("button");
      btn.innerText = type.charAt(0).toUpperCase() + type.slice(1);
      btn.addEventListener("click", ev => {
        ev.stopPropagation();
        card.difficulty = card.difficulty === type ? null : type;
        saveDeckOverride(); renderCard();
      });
      container.appendChild(btn);
    });
  });

  positionCounter.innerText = `${currentIndex + 1} / ${deck.cards.length}`;
  updateCounts();
}

// ----------------------------
// TRACK PROGRESS TOGGLE
// ----------------------------
function updateTrackState() {
  if (!trackToggle.checked) {
    // tracking is off
    markBtn.disabled = true;
    stopTimer();
    trackMessage.innerText = "Enable Track Progress to start tracking your learning and timer.";
    nextBtn.disabled = false; prevBtn.disabled = false;
  } else {
    // tracking is on
    markBtn.disabled = false;
    if (deck.cards.every(c => c.learned) || localStorage.getItem(COMPLETED_KEY)) {
      // reset deck if already completed
      deck.cards.forEach(c => { c.learned = false; c.difficulty = null; });
      saveDeckOverride();
      elapsedSeconds = 0;
      currentIndex = 0;
      localStorage.removeItem(COMPLETED_KEY);
      renderCard(); updateCounts();
    } else {
      elapsedSeconds = parseInt(localStorage.getItem(TIMER_KEY) || "0", 10) || 0;
      currentIndex = 0; renderCard(); updateCounts();
    }
    nextBtn.disabled = true; 
    prevBtn.disabled = true;
    startTimer();
  }
}
trackToggle.addEventListener("change", updateTrackState);
updateTrackState();

// ----------------------------
// NAVIGATION BUTTONS
// ----------------------------
nextBtn.addEventListener("click", () => { 
  if (currentIndex < deck.cards.length - 1) { currentIndex++; renderCard(); } 
});
prevBtn.addEventListener("click", () => { 
  if (currentIndex > 0) { currentIndex--; renderCard(); } 
});

// keyboard navigation
window.addEventListener("keydown", ev => { 
  if (ev.key === "ArrowRight") nextBtn.click(); 
  if (ev.key === "ArrowLeft") prevBtn.click(); 
});

// ----------------------------
// MOBILE SWIPE NAVIGATION
// ----------------------------
let touchStartX = 0, touchEndX = 0;
cardsContainer.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; });
cardsContainer.addEventListener("touchend", e => { 
  touchEndX = e.changedTouches[0].screenX; 
  handleSwipe(); 
});
function handleSwipe() { 
  if (touchEndX < touchStartX - 50) nextBtn.click(); 
  if (touchEndX > touchStartX + 50) prevBtn.click(); 
}

// ----------------------------
// MARK CARD AS LEARNED
// ----------------------------
markBtn.addEventListener("click", ev => {
  ev.stopPropagation();
  if (!trackToggle.checked) return;
  const card = deck.cards[currentIndex];
  card.learned = !card.learned;
  const cardDiv = cardsContainer.querySelector(".flip-card");
  if (card.learned) cardDiv.classList.add("learned"); 
  else cardDiv.classList.remove("learned");
  saveDeckOverride(); updateCounts();
  if (card.learned && currentIndex < deck.cards.length - 1) { currentIndex++; renderCard(); }
});

// ----------------------------
// COMPLETION POPUP
// ----------------------------
function markDeckCompleted() {
  if (localStorage.getItem(COMPLETED_KEY)) return;
  localStorage.setItem(COMPLETED_KEY, "true");
  stopTimer();

  const easyCards = deck.cards.filter(c => c.difficulty === "easy");
  const hardCards = deck.cards.filter(c => c.difficulty === "hard");

  const buildListHtml = cardsArr => {
    if (!cardsArr.length) return `<div class="no-cards">— none —</div>`;
    return cardsArr.map(c => `<div class="card-summary">
      <div class="q-label">Question:</div><div class="q-text">${escapeHtml(c.question)}</div>
      <div class="a-label">Answer:</div><div class="a-text">${escapeHtml(c.answer)}</div>
    </div>`).join("");
  };

  overlay.innerHTML = `
    <div class="completionCard">
      <button class="mb-4 text-white fs-3 border-0  bg-transparent" id="closeOverlay">✕</button>
      <div class="completionContent">
        <h1>Deck complete! Knowledge upgraded.</h1>
        <div class="timeTaken">Time taken: <strong>${formatTime(elapsedSeconds)}</strong></div>
        <div class="easyCount">Easy cards: <strong>${easyCards.length}</strong></div>
        <div class="easyList">${buildListHtml(easyCards)}</div>
        <div class="hardCount">Hard cards: <strong>${hardCards.length}</strong></div>
        <div class="hardList">${buildListHtml(hardCards)}</div>
      </div>
      <div class="completionActions">
        <button id="studyAgainBtn" class="btn btn-success">Study Again</button>
        <button id="goHomeBtn" class="btn btn-primary">Home</button>
      </div>
    </div>
  `;
  overlay.classList.remove("hidden");

  // buttons inside completion popup
  qs("#studyAgainBtn").addEventListener("click", () => {
    deck.cards.forEach(c => { c.learned = false; c.difficulty = null; });
    saveDeckOverride();
    elapsedSeconds = 0;
    timerDisplay.innerText = formatTime(elapsedSeconds);
    overlay.classList.add("hidden");
    currentIndex = 0;
    renderCard(); updateCounts();
    localStorage.removeItem(COMPLETED_KEY); localStorage.removeItem(TIMER_KEY);
    startTimer();
  });

  qs("#goHomeBtn").addEventListener("click", () => {
    stopTimer(); saveDeckOverride(); localStorage.removeItem(TIMER_KEY);
    window.location.href = goHomeUrl;
  });
  qs("#closeOverlay").addEventListener("click", () => overlay.classList.add("hidden"));
}

// ----------------------------
// INITIAL RENDER
// ----------------------------
titleEl.innerText = deck.title || "Untitled";
subtitleEl.innerText = deck.subtitle || "";
renderCard();
updateCounts();

// ----------------------------
// SAVE PROGRESS BEFORE LEAVING
// ----------------------------
window.addEventListener("beforeunload", () => {
  if (trackToggle.checked) { stopTimer(); saveDeckOverride(); }
});
