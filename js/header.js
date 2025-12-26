document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("topbarMenu");

  if (!hamburger || !menu) return;

  // toggle menu
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("show");
    hamburger.classList.toggle("active");
  });

  // đóng menu khi click link hoặc button
  menu.querySelectorAll("a, button").forEach((item) => {
    item.addEventListener("click", () => {
      menu.classList.remove("show");
      hamburger.classList.remove("active");
    });
  });

  // click ra ngoài → đóng menu
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove("show");
      hamburger.classList.remove("active");
    }
  });

  // resize lên desktop → đóng menu
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      menu.classList.remove("show");
      hamburger.classList.remove("active");
    }
  });
});
