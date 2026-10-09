const savedTheme = localStorage.getItem("theme");
 
const themeButton = document.querySelector("#theme-switcher-button");
const themeLabel = document.querySelector("#theme-switcher-label");
 
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const startDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
 
const applyTheme = (isDark) => {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("light", !isDark);
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeLabel.textContent = isDark ? "Light Mode" : "Dark Mode";
};
 
themeButton.addEventListener("click", () => {
  const isDark = !document.documentElement.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});
 
applyTheme(startDark);
