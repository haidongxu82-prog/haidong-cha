function showModelGroup(group) {
  document.querySelectorAll(".model").forEach((model) => {
    const visible = model.dataset.group === group;
    model.classList.toggle("is-hidden", !visible);
    if (!visible) model.classList.remove("active");
  });

  const firstVisible = document.querySelector(`.model[data-group="${group}"]`);
  if (firstVisible && !document.querySelector(`.model[data-group="${group}"].active`)) {
    firstVisible.classList.add("active");
  }
}

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showModelGroup(button.textContent.includes("生图") ? "image" : "chat");
  });
});

document.querySelectorAll(".model").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(`.model[data-group="${button.dataset.group}"]`).forEach((item) => item.classList.remove("active"));
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
