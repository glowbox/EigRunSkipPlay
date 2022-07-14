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


var osc = require("osc");

var udpPort = new osc.UDPPort({
  // This is where sclang is listening for OSC messages.
  remoteAddress: "127.0.0.1",
  remotePort: 57120,
  metadata: true
});

// Open the socket.
udpPort.open();

const socket = io("https://eig.glowbox.io/monitor");

socket.on("error", () => {
  console.log("error");
});

socket.on("connect_error", (e) => {
  console.log("connect_error " + e);
});

socket.on("connect", () => {
  console.log("connect");
});

socket.on("disconnect", () => {
  console.log(socket.id); // undefined
});

socket.on("clients", (data) => {
  console.log(`Processing ${data.length} players`);
  for (i = 0; i < data.length; i++) {

    var msg = {
      address: `/player`,
      args: [
        {
          type: "i",
          value: data[i].id
        },
        {
          type: "f",
          value: data[i].motion.rotationRate[0]
        },
        {
          type: "f",
          value: data[i].motion.rotationRate[1]
        },
        {
          type: "f",
          value: data[i].motion.rotationRate[2]
        },
        {
          type: "f",
          value: data[i].motion.acceleration[0]
        },
        {
          type: "f",
          value: data[i].motion.acceleration[1]
        },
        {
          type: "f",
          value: data[i].motion.acceleration[2]
        },
        {
          type: "f",
          value: data[i].motion.orientation[0]
        },
        {
          type: "f",
          value: data[i].motion.orientation[1]
        },
        {
          type: "f",
          value: data[i].motion.orientation[2]
        },
        {
          type: "f",
          value: data[i].tap.count
        },
        {
          type: "f",
          value: data[i].tap.rate
        },
        {
          type: "f",
          value: data[i].zone
        }
      ]
    };
    //console.log("Sending message", msg.address, msg.args, "to", udpPort.options.remoteAddress + ":" + udpPort.options.remotePort);
    udpPort.send(msg);
  }
});

console.log('Running');