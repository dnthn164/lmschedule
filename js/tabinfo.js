document.querySelectorAll(".top-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.target;
    const section = document.getElementById(id);
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});
