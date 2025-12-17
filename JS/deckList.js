// deckList.js - shows all saved decks, lets user study, export, edit, delete, and reorder

import { Storage } from "./storage.js";

// get container elements
const emptyState = document.getElementById("emptyState");
const deckList = document.getElementById("deckList");

// ----------------------------
// render all decks on the page
// ----------------------------
function renderDecks() {
  const decks = Storage.getDecks();

  // show empty state if no decks
  if (!decks || decks.length === 0) {
    emptyState.style.display = "block";
    deckList.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";
  deckList.innerHTML = "";

  decks.forEach(deck => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card p-1 mb-3 bg-dark text-black";
    cardDiv.style.width = "24rem";
    cardDiv.style.height = "14rem";
    cardDiv.setAttribute("data-id", deck.id);

    const cardCount = deck.cards ? deck.cards.length : 0;

    cardDiv.innerHTML = `
      <div class="card-body d-flex flex-column justify-content-between position-relative">
        <div class="d-flex flex-column justify-content-between">
          <div class="d-flex gap-3">
            <div class="deck-title-box d-flex flex-column gap-1">
              <h5 class="card-title mb-0">${deck.title}</h5>
              <p class="card-text">${deck.subtitle}</p>
            </div>
            <i class="bi bi-grip-vertical drag-handle fs-3" style="cursor: grab;"></i>
          </div>
          <p class="text-black fw-bold">${cardCount === 1 ? "Card:" : "Cards:"} ${cardCount}</p>
        </div>

        <div class="d-flex justify-content-between">
          <div class="d-flex gap-2">
            <a href="deck-detail.html?id=${deck.id}" class="btn btn-primary" id="viewbutton">Study</a>
            <a href="#" class="btn btn-primary" id="exportButton">Export as JSON</a>
          </div>
          <div class="d-flex gap-2">
            <button id="edit-btn" class="btn btn-sm btn-danger" data-bs-toggle="tooltip"
              data-bs-placement="bottom" title="Edit">
              <i class="bi bi-pen"></i>
            </button>
            <button id="delete-btn" class="btn btn-sm btn-danger" data-bs-toggle="tooltip"
              data-bs-placement="bottom" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // ----------------------------
    // export deck as JSON file
    // ----------------------------
    const exportBtn = cardDiv.querySelector("#exportButton");
    exportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const deckData = JSON.stringify(deck, null, 2);
      const blob = new Blob([deckData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deck.title.replace(/\s+/g, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    // ----------------------------
    // open deck detail when card body clicked (ignore buttons or drag)
    // ----------------------------
    cardDiv.querySelector(".card-body").addEventListener("click", e => {
      if (
        !e.target.closest("button") &&
        !e.target.closest("#exportButton") &&
        !e.target.classList.contains("drag-handle")
      ) {
        window.location.href = `deck-detail.html?id=${deck.id}`;
      }
    });

    // ----------------------------
    // delete deck
    // ----------------------------
    cardDiv.querySelector("#delete-btn").addEventListener("click", e => {
      e.stopPropagation();
      if (confirm(`Delete deck "${deck.title}"?`)) {
        Storage.deleteDeck(deck.id);
        renderDecks(); // refresh list
      }
    });

    // edit deck
    cardDiv.querySelector("#edit-btn").addEventListener("click", e => {
      e.stopPropagation();
      // go to edit page with deck id as query param
      window.location.href = `edit-deck.html?id=${deck.id}`;
    });

    deckList.appendChild(cardDiv);
  });

  // ----------------------------
  // initialize Bootstrap tooltips
  // ----------------------------
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => {
    if (!bootstrap.Tooltip.getInstance(el)) {
      new bootstrap.Tooltip(el);
    }
  });

  // ----------------------------
  // enable drag-and-drop reordering using jQuery UI sortable
  // ----------------------------
  $("#deckList").sortable({
    handle: ".drag-handle",
    placeholder: "ui-sortable-placeholder",
    opacity: 1,
    cursor: "grabbing",
    tolerance: "pointer",
    forceHelperSize: true,
    revert: 100,
    update: function () {
      // get current order of deck ids after sorting
      const ids = [...deckList.children].map(item => item.getAttribute("data-id"));
      Storage.reorderDecks(ids); // save new order
    }
  }).disableSelection();
}

// ----------------------------
// initialize on page load
// ----------------------------
document.addEventListener("DOMContentLoaded", renderDecks);
