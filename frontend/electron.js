import { app, BrowserWindow } from "electron";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "PADDLE POINT",
    autoHideMenuBar: true,
    backgroundColor: "#f4f7fb",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://127.0.0.1:5173");

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("PADDLE POINT loaded successfully!");
  });

  mainWindow.webContents.on("did-fail-load", (_, code, description, url) => {
    console.error("FAILED TO LOAD:", code, description, url);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log("Electron is ready!");

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});