// select all FAQ items
document.querySelectorAll(".faq-item").forEach(item => {
  // when the question is clicked, toggle "active" class to show/hide the answer
  item.querySelector(".faq-question").addEventListener("click", () => {
    item.classList.toggle("active");
  });
});
