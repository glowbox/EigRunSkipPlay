// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { io } = require("socket.io-client");

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const socket = io("https://eig.glowbox.io/monitor");

socket.on("error", () => {
  console.log("error");
});

socket.on("connect_error", (e) => {
  console.log("connect_error " + e);
});

socket.on("connect", () => {
  console.log("connect");

  const engine = socket.io.engine;
  console.log(engine.transport.name); // in most cases, prints "polling"

  engine.once("upgrade", () => {
    // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
    console.log(engine.transport.name); // in most cases, prints "websocket"
  });

  engine.on("packet", ({ type, data }) => {
    // called for each packet received
    console.log("packet");
  });

  engine.on("packetCreate", ({ type, data }) => {
    // called for each packet sent
    console.log("packetCreate");
  });

  engine.on("drain", () => {
    // called when the write buffer is drained
    console.log("drain");
  });

  engine.on("close", (reason) => {
    // called when the underlying connection is closed
    console.log("close");
  });
});

socket.on("disconnect", () => {
  console.log(socket.id); // undefined
});

socket.on("clients", (data) => {
  console.log(data); // undefined
});

console.log('Running');