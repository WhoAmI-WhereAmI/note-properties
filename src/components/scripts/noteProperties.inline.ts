const STORAGE_KEY = "note-properties-collapsed";

function init() {
  const details = document.querySelector<HTMLDetailsElement>("details.note-properties");
  if (!details) return;

  // Obsidian marks a collapsed block with `is-collapsed`; themes style that.
  const sync = () => details.classList.toggle("is-collapsed", !details.open);

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    const isCollapsed = saved === "true";
    details.open = !isCollapsed;
  }
  sync();

  const toggleHandler = () => {
    sync();
    localStorage.setItem(STORAGE_KEY, String(!details.open));
  };

  details.addEventListener("toggle", toggleHandler);

  if (typeof window !== "undefined" && window.addCleanup) {
    window.addCleanup(() => {
      details.removeEventListener("toggle", toggleHandler);
    });
  }
}

document.addEventListener("nav", () => {
  init();
});
document.addEventListener("render", () => {
  init();
});
