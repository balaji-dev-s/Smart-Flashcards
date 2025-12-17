// library.js - shows decks from a library JSON and lets user add them to their own decks

import { Storage } from "./storage.js";

// get the container for decks and empty state message
const deckList = document.getElementById("deckList");
const emptyState = document.getElementById("emptyState");

// fetch decks from the library JSON file
async function fetchLibraryDecks() {
  try {
    const res = await fetch("./library-decks.json");
    return await res.json();
  } catch (err) {
    console.error("error loading library JSON:", err);
    return [];
  }
}

// create a deck card and add it to the page
function renderDeck(deck, isLibrary = false) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "card mb-3";
  cardDiv.style.width = "24rem";
  cardDiv.setAttribute("data-id", deck.id);

  const cardCount = deck.cards ? deck.cards.length : 0;

  cardDiv.innerHTML = `
    <div class="card-body d-flex flex-column justify-content-between">
      <div>
        <h5 class="card-title mb-1">${deck.title}</h5>
        <p class="card-text">${deck.subtitle}</p>
        <p class="fw-bold">${cardCount} ${cardCount === 1 ? "Card" : "Cards"}</p>
      </div>
      <div class="d-flex gap-2 mt-2">
        ${isLibrary
      ? `<button class="btn btn-success addDeckBtn">Add Deck</button>`
      : `<a href="deck-detail.html?id=${deck.id}" class="btn btn-primary">Study</a>`}
      </div>
    </div>
  `;

  // handle add deck button click
  if (isLibrary) {
    cardDiv.querySelector(".addDeckBtn").addEventListener("click", () => {
      Storage.addDeck(deck); // save deck to localStorage
      alert("Deck added, click OK to go Home.");
      window.location.href = "index.html"; // redirect to home
    });
  }

  deckList.appendChild(cardDiv); // add card to the page
}

// load all library decks and render them
async function renderLibrary() {
  const libraryDecks = await fetchLibraryDecks();
  deckList.innerHTML = "";

  if (!libraryDecks.length) {
    emptyState.style.display = "block"; // show empty state if no decks
    return;
  } else {
    emptyState.style.display = "none"; // hide empty state
  }

  libraryDecks.forEach(deck => renderDeck(deck, true)); // render each deck
}

// wait until page loads, then render library
document.addEventListener("DOMContentLoaded", renderLibrary);
