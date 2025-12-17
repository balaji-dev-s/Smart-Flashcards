// create-deck.js - lets user create a new deck with multiple cards

import { Storage } from "./storage.js";

// ----------------------------
// DOM ELEMENTS
// ----------------------------
const deckTitleInput = document.getElementById("deckTitle");
const deckSubtitleInput = document.getElementById("deckSubtitle");
const cardsContainer = document.getElementById("cardsContainer");
const addCardBtn = document.getElementById("addCardBtn");
const saveDeckBtn = document.getElementById("saveDeckBtn");

// ----------------------------
// HELPER: generate unique ID
// ----------------------------
function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

// ----------------------------
// HELPER: create a single card element
// ----------------------------
function createCardElement() {
  const cardDiv = document.createElement("div");
  cardDiv.className = "card p-3 mb-3 card-item position-relative";

  cardDiv.innerHTML = `
    <i class="bi bi-grip-vertical drag-handle fs-3 position-absolute" 
       style="top: 10px; right: 10px; cursor: grab;"></i>
    <h5>Card</h5>
    <div class="mb-2">
      <label class="form-label text-black">Question</label>
      <input type="text" class="form-control questionInput" placeholder="Enter question">
    </div>
    <div class="mb-2">
      <label class="form-label">Answer</label>
      <input type="text" class="form-control answerInput" placeholder="Enter answer">
    </div>
  `;

  return cardDiv;
}

// ----------------------------
// ADD A NEW CARD TO PAGE
// ----------------------------
function addCard() {
  const card = createCardElement();
  cardsContainer.appendChild(card);
  updateCardNumbers();
}

// ----------------------------
// UPDATE CARD NUMBERS (Card 1, 2, 3…)
// ----------------------------
function updateCardNumbers() {
  const cardItems = document.querySelectorAll(".card-item");
  cardItems.forEach((card, index) => {
    card.querySelector("h5").textContent = `Card ${index + 1}`;
  });
}

// ----------------------------
// INITIALIZE PAGE WITH DEFAULT CARDS
// ----------------------------
function initializeDefaultCards() {
  for (let i = 0; i < 3; i++) addCard();
}

// ----------------------------
// ENABLE DRAG-AND-DROP SORTING
// ----------------------------
function enableCardSorting() {
  Sortable.create(cardsContainer, {
    handle: ".drag-handle",
    animation: 150,
    ghostClass: "sortable-ghost",
    fallbackOnBody: true,
    swapThreshold: 0.65,
    touchStartThreshold: 5,
    onEnd: () => updateCardNumbers()
  });
}

// ----------------------------
// COLLECT CARD DATA FROM PAGE
// ----------------------------
function getCardsData() {
  const questions = document.querySelectorAll(".questionInput");
  const answers = document.querySelectorAll(".answerInput");
  const cards = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i].value.trim();
    const a = answers[i].value.trim();
    if (q && a) {
      cards.push({ id: generateId(), question: q, answer: a });
    }
  }

  return cards;
}

// ----------------------------
// SAVE DECK TO STORAGE
// ----------------------------
function saveDeck() {
  const title = deckTitleInput.value.trim();
  const subtitle = deckSubtitleInput.value.trim();

  if (!title) {
    alert("Deck title is required!");
    return;
  }

  const cards = getCardsData();
  if (cards.length === 0) {
    alert("Add at least one card!");
    return;
  }

  const deck = {
    id: generateId(),
    title,
    subtitle,
    cards,
    createdAt: new Date().toISOString()
  };

  Storage.addDeck(deck);
  window.location.href = "index.html";
}

// ----------------------------
// EVENT LISTENERS
// ----------------------------
addCardBtn.addEventListener("click", addCard);
saveDeckBtn.addEventListener("click", saveDeck);

// ----------------------------
// INITIALIZE PAGE
// ----------------------------
initializeDefaultCards();
enableCardSorting();
