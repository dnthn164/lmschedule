/*********************************
 * HEADER HAMBURGER + STICKY
 *********************************/

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("topbarMenu");

  if (!hamburger || !menu) return;

  /* toggle menu */
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation(); // ❗ quan trọng
    menu.classList.toggle("show");
    hamburger.classList.toggle("active");
  });

  /* đóng menu khi click link (mobile) */
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("show");
      hamburger.classList.remove("active");
    });
  });

  /* đóng menu khi click ra ngoài */
  document.addEventListener("click", (e) => {
    if (
      menu.classList.contains("show") &&
      !menu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      menu.classList.remove("show");
      hamburger.classList.remove("active");
    }
  });

  /* click trong menu thì không đóng */
  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  /* đóng menu khi resize lên desktop */
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      menu.classList.remove("show");
      hamburger.classList.remove("active");
    }
  });
});
