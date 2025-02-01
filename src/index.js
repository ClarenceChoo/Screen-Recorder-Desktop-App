const { app, BrowserWindow, desktopCapturer, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Handle Electron Squirrel Startup
if (require('electron-squirrel-startup')) {
  app.quit();
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Secure preload script
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.openDevTools();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 🛠 IPC Handlers (Communicates with Renderer)
ipcMain.on('get-video-sources', async (event) => {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => ({
      label: source.name,
      click: () => event.sender.send('source-selected', source),
    }))
  );

  videoOptionsMenu.popup();
});

// 🛠 Save Video File
ipcMain.on('save-video', async (event, arrayBuffer) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save your recording',
      buttonLabel: 'Save Video',
      defaultPath: `recording-${Date.now()}.webm`,
      filters: [{ name: 'WebM Video', extensions: ['webm'] }]
    });

    if (filePath) {
      // ✅ Convert ArrayBuffer to Buffer before saving
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error("❌ Failed to save video:", err);
        } else {
          console.log(`✅ Video saved to: ${filePath}`);
        }
      });
    } else {
      console.log("❌ User canceled save");
    }
  } catch (error) {
    console.error("❌ Error saving video:", error);
  }
});
