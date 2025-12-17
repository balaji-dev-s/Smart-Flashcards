// storage.js - handles saving and loading decks from localStorage
export const Storage = {
  // get all saved decks, or empty array if none
  getDecks() {
    return JSON.parse(localStorage.getItem("decks")) || [];
  },

  // reorder decks based on an array of ids
  reorderDecks(order) {
    const decks = Storage.getDecks();
    const newOrder = order.map(id => decks.find(d => d.id == id));
    localStorage.setItem("decks", JSON.stringify(newOrder));
  },

  // generate a unique id for each deck
  generateId() {
    return "deck_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  },

  // add a new deck to storage and give it a unique id
  addDeck(deck) {
    const decks = this.getDecks();
    deck.id = this.generateId();
    decks.push(deck);
    localStorage.setItem("decks", JSON.stringify(decks));
  },

  // get a single deck by its id
  getDeckById(id) {
    const decks = this.getDecks();
    return decks.find(deck => deck.id === id);
  },

  // delete a deck by its id
  deleteDeck(id) {
    const decks = this.getDecks().filter(deck => deck.id !== id);
    localStorage.setItem("decks", JSON.stringify(decks));
  }
};
