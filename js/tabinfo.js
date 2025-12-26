const tabs = document.querySelectorAll(".artist-tabs a");

tabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();

    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const target = document.querySelector(tab.getAttribute("href"));
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});
