const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoSources: () => ipcRenderer.send('get-video-sources'),
  saveVideo: (buffer) => ipcRenderer.send('save-video', buffer),
  onSourceSelected: (callback) => ipcRenderer.on('source-selected', (event, source) => callback(source)),
});
