import { Storage } from "./storage.js";

// get elements
const deckTitle = document.getElementById("deckTitle");
const deckSubtitle = document.getElementById("deckSubtitle");
const cardsContainer = document.getElementById("cardsContainer");
const addCardBtn = document.getElementById("addCardBtn");
const updateDeckBtn = document.getElementById("updateDeckBtn");

// get deck id from URL
const urlParams = new URLSearchParams(window.location.search);
const deckId = urlParams.get("id");

// find deck from storage
const deck = Storage.getDeckById(deckId);
if (!deck) throw new Error("Deck not found");

// initialize input fields with deck data
deckTitle.value = deck.title;
deckSubtitle.value = deck.subtitle;

// generate unique id for cards
function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

// update card numbers
function updateCardNumbers() {
  document.querySelectorAll(".card-item").forEach((card, idx) => {
    const title = card.querySelector("h5");
    title.textContent = `Card ${idx + 1}`;
  });
}

// add a card input
function addCardInput(question = "", answer = "") {
  const cardDiv = document.createElement("div");
  cardDiv.className = "card p-3 mb-3 card-item position-relative";

  cardDiv.innerHTML = `
    <i class="bi bi-grip-vertical drag-handle fs-3 position-absolute" 
       style="top: 10px; right: 10px; cursor: grab;"></i>
    <h5>Card</h5>
    <div class="mb-2">
      <label class="form-label">Question</label>
      <input type="text" class="form-control questionInput" value="${question}">
    </div>
    <div class="mb-2">
      <label class="form-label">Answer</label>
      <input type="text" class="form-control answerInput" value="${answer}">
    </div>
  `;

  cardsContainer.appendChild(cardDiv);
  updateCardNumbers();
}

// render existing cards
deck.cards.forEach(c => addCardInput(c.question, c.answer));

// add new card button
addCardBtn.addEventListener("click", () => addCardInput());

// enable sortable (drag & drop)
Sortable.create(cardsContainer, {
  handle: ".drag-handle",
  animation: 150,
  ghostClass: "sortable-ghost",
  fallbackOnBody: true,
  swapThreshold: 0.65,
  touchStartThreshold: 5,
  onEnd: updateCardNumbers
});

// update deck
updateDeckBtn.addEventListener("click", () => {
  const title = deckTitle.value.trim();
  const subtitle = deckSubtitle.value.trim();

  if (!title) return alert("Deck title is required!");

  const questions = document.querySelectorAll(".questionInput");
  const answers = document.querySelectorAll(".answerInput");
  const cards = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i].value.trim();
    const a = answers[i].value.trim();
    if (q && a) cards.push({ id: deck.cards[i]?.id || generateId(), question: q, answer: a });
  }

  if (cards.length === 0) return alert("Add at least one card!");

  // update deck in storage
  const updatedDeck = { ...deck, title, subtitle, cards };
  const decks = Storage.getDecks();
  const idx = decks.findIndex(d => d.id === deckId);
  decks[idx] = updatedDeck;
  localStorage.setItem("decks", JSON.stringify(decks));

  alert("Deck updated successfully!");
  window.location.href = "index.html";
});
