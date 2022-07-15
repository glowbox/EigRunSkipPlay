const { contextBridge, ipcRenderer } = require('electron')

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  sendWSMessage: (data) => ipcRenderer.invoke('SendWSMessage',data),
  onClients: (data) => ipcRenderer.on('clients', data),
  onZones: (data) => ipcRenderer.on('zones', data)
})