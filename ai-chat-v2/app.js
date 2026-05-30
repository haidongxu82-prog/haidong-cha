document.querySelectorAll(".mode,.model").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.classList.contains("mode") ? ".mode" : ".model";
    document.querySelectorAll(group).forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

const root = document.documentElement;
const historyButton = document.querySelector(".rail-btn.history");
const drawerClose = document.querySelector(".drawer-close");

historyButton.addEventListener("click", () => {
  const open = document.body.classList.toggle("history-open");
  historyButton.setAttribute("aria-expanded", String(open));
});

drawerClose.addEventListener("click", () => {
  document.body.classList.remove("history-open");
  historyButton.setAttribute("aria-expanded", "false");
});

document.querySelectorAll(".history-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".history-item").forEach((entry) => entry.classList.remove("active"));
    item.classList.add("active");
    document.body.classList.remove("history-open");
    historyButton.setAttribute("aria-expanded", "false");
  });
});

document.querySelector(".theme").addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
});
