/*********************************
 * HEADER HAMBURGER + STICKY
 *********************************/

document.addEventListener("DOMContentLoaded", () => {

  const hamburger = document.getElementById("hamburger");
  const menu      = document.getElementById("topbarMenu");

  if (!hamburger || !menu) return;

  hamburger.addEventListener("click", () => {
    menu.classList.toggle("show");
  });

  // đóng menu khi click link (mobile)
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  });

  // đóng menu khi resize lên desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      menu.classList.remove("show");
    }
  });

});
