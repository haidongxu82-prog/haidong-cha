document.querySelectorAll(".mode,.model").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.classList.contains("mode") ? ".mode" : ".model";
    document.querySelectorAll(group).forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelector(".theme").addEventListener("click", () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
});
