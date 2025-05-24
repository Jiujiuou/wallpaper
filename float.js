const { ipcRenderer } = require("electron");

document.getElementById("deleteBtn").addEventListener("click", () => {
  ipcRenderer.invoke("delete-current-wallpaper");
});
