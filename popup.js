const options = [
  ["disable-commenting", "disableCommenting"],
  ["hide-shorts", "hideShorts"],
  ["hide-games", "hideGames"],
];

const defaults = {
  disableCommenting: true,
  hideShorts: true,
  hideGames: true,
};

chrome.storage.local.get(defaults, (data) => {
  for (const [id, key] of options) {
    document.getElementById(id).checked = !!data[key];
  }
});

for (const [id, key] of options) {
  document.getElementById(id).addEventListener("change", (event) => {
    chrome.storage.local.set({ [key]: event.target.checked });
  });
}
