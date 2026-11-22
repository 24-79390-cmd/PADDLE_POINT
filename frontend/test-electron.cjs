const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  console.log("Electron test started");

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "PADDLE POINT - Electron Test"
  });

  win.loadURL("https://example.com");
});