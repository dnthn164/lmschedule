// =====================
// SELECTORS
// =====================
const tabs = document.querySelectorAll('.artist-tabs a');
const sections = document.querySelectorAll('.idol-section');

// =====================
// STICKY OFFSET
// =====================
function calcStickyOffset() {
  const header = document.querySelector('.topbar');
  const tabBar = document.querySelector('.artist-tabs');
  return (header?.offsetHeight || 0) + (tabBar?.offsetHeight || 0);
}

let STICKY_OFFSET = 0;

function updateStickyOffset() {
  STICKY_OFFSET = calcStickyOffset();
}

window.addEventListener('resize', updateStickyOffset);
window.addEventListener('load', updateStickyOffset);

// =====================
// CLICK TAB → SCROLL CHUẨN
// =====================
tabs.forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();

    const id = tab.getAttribute('href')?.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    const y =
      window.scrollY +
      target.getBoundingClientRect().top -
      STICKY_OFFSET -
      8;

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  });
});

// =====================
// VISIBLE HEIGHT CALC
// =====================
function getVisibleHeight(el) {
  const rect = el.getBoundingClientRect();
  const viewportTop = STICKY_OFFSET;
  const viewportBottom = window.innerHeight;

  const visibleTop = Math.max(rect.top, viewportTop);
  const visibleBottom = Math.min(rect.bottom, viewportBottom);

  return Math.max(0, visibleBottom - visibleTop);
}

// =====================
// ACTIVE SECTION (CORE LOGIC)
// =====================
function updateActive() {
  let maxVisible = 0;
  let activeSection = sections[0];

  sections.forEach(section => {
    const visible = getVisibleHeight(section);
    if (visible > maxVisible) {
      maxVisible = visible;
      activeSection = section;
    }
  });

  if (!activeSection) return;

  const id = activeSection.id;

  sections.forEach(s => s.classList.remove('active'));
  activeSection.classList.add('active');

  tabs.forEach(tab => {
    tab.classList.toggle(
      'active',
      tab.getAttribute('href') === `#${id}`
    );
  });
}

// =====================
// SCROLL / INIT
// =====================
window.addEventListener('scroll', updateActive, { passive: true });
window.addEventListener('resize', updateActive);
window.addEventListener('load', updateActive);

// =====================
// COPY HASHTAG
// =====================
document.querySelectorAll('.hashtags span').forEach(tag => {
  tag.addEventListener('click', () => {
    navigator.clipboard.writeText(tag.innerText);
    tag.classList.add('copied');
    setTimeout(() => tag.classList.remove('copied'), 600);
  });
});
