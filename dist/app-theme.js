(() => {
  const key = "deallogic:app-theme";
  const names = { grey: "Grey", navy: "Navy blue", forest: "Dark green" };
  const browserColours = { grey: "#f2f2f0", navy: "#f1f5f9", forest: "#f1f5ef" };
  const valid = value => Object.hasOwn(names, value) ? value : "grey";
  const current = valid(DealLogicStorage.getItem(key));
  document.documentElement.dataset.appTheme = current;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", browserColours[current]);

  function syncControls(theme) {
    const input = document.querySelector(`input[name="app-theme"][value="${theme}"]`);
    if (input) input.checked = true;
  }

  document.addEventListener("DOMContentLoaded", () => syncControls(current));
  document.addEventListener("change", event => {
    if (!event.target.matches('input[name="app-theme"]')) return;
    const theme = valid(event.target.value);
    document.documentElement.dataset.appTheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", browserColours[theme]);
    DealLogicStorage.setItem(key, theme);
    syncControls(theme);
  });
})();
