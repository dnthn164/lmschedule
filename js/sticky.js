document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("topbar");
  const placeholder = document.getElementById("header-placeholder");

  const headerHeight = header.offsetHeight;
  placeholder.style.height = `${headerHeight}px`;
  placeholder.style.display = "none";

  const stickyPoint = header.offsetTop;

  let isFixed = false;

  window.addEventListener("scroll", () => {
    const shouldFix = window.scrollY >= stickyPoint;

    if (shouldFix && !isFixed) {
      header.classList.add("is-fixed");
      placeholder.style.display = "block";
      isFixed = true;
    }

    if (!shouldFix && isFixed) {
      header.classList.remove("is-fixed");
      placeholder.style.display = "none";
      isFixed = false;
    }
  });
});
