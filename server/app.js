require("dotenv").config();

const fs = require("fs");
const express = require("express");
const app = require('express')();
const https = require('https');

var privateKey  = fs.readFileSync(process.env.HTTPS_KEY_PATH, 'utf8');
var certificate = fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf8');

var credentials = {
    "key" : privateKey,
    "cert" : certificate
};

if(process.env.HTTPS_CA_PATH != "") {
    var ca = fs.readFileSync(process.env.HTTPS_CERT_PATH, 'utf8');
    credentials.ca = ca;
}

const httpsServer = https.createServer(credentials, app);
const io = require('socket.io')(httpsServer);

app.use(express.static('public'))



const dataBroadcastInterval = 1000 / 5.0;

let tapAverageSampleCount = 8;
let tapTotals = [];

let clients = [];


for(var i = 0; i < 4; i++) {
    let id = i;
    clients[i] = {
        "id" : id,
        "socket" : null,
        "motion" : {},
        "tap" : {}
    };
}

console.log(clients);


for(var i = 0; i < tapAverageSampleCount; i++){
    tapTotals[i] = 0;
}

function getAvailableId() {
    let id = -1;
    for(var i = 0; i < clients.length; i++){
        if(clients[i].socket == null){
            id = i;
            break;
        }
    }
    return id;
}


function addNewClient(socket) {
    
    socket.on("register", (data) => {

        let id = getAvailableId();
        
        if(id != -1) {
            console.log("Adding client at index " + id);
            
            clients[id].socket = socket;
            clients[id].zone = -1;

            socket.emit("register", {
                "id" : id
            });

            socket.on("motion", (data) => {
               console.log(data);
               clients[id].motion = data;//Object.apply({}, data);
            });

            socket.on("tap", (data) => {
                //console.log("Got taps from client " + id + ", count=" + data.count);
                clients[id].tap = Object.apply({}, data);
            });

            socket.on("zone", (data) => {
                console.log("Client " + id + " changing zone.", data);
                clients[id].zone = data.joining;
            });

            socket.on("disconnect", () => {
                removeClient(socket);
            });
        } else {       
            console.log("ERROR: No available client ID's left for newly connecting client..");
        }

    });
}


function removeClient(socket) {
    
    for(var i = 0; i < clients.length; i++) {
        if(clients[i].socket === socket) {
            console.log("Removing client at index " + i);
            clients[i].socket = null;
            break;
        }
    }

}


io.on("connection", (socket) => {
    addNewClient(socket);
});


let nsMonitor = io.of("/monitor");


function addTap() {
    tapCount++;
    tapTotals[tapTotals.length - 1]++;
}



setInterval(() => {

    //let total = 0;
    //for(var i = 0; i < tapTotals.length; i++){
    //    total += tapTotals[i];
    //}

    for(var i = 0; i < tapAverageSampleCount - 1; i++) {
        tapTotals[i] = tapTotals[i+1];
    }
    
    tapTotals[tapTotals.length - 1] = 0;
    //tapCountPerSecond = total / 2.0;

}, 250);



setInterval(() => {
    
    let total = 0;
    for(var i = 0; i < tapTotals.length; i++) {
        total += tapTotals[i];
    }
    let tapCountPerSecond = total / 2.0;

    //console.log(`Taps: ${tapCount}, average: ${tapCountPerSecond}`);    
    //console.log("TAP COUNT: " + tapCount);

    tapCount = 0;

    let data = [];

    for(var i = 0; i < clients.length; i++) {
        if(clients[i].socket != null) {
            let client = clients[i];
            let entry = {
                "id" : client.id,
                "motion" : {},
                "tap" : {},
                "zone" : (client.socket != null) ? client.zone : -1
            };
                
            entry.motion = Object.assign(entry.motion, client.motion);
            entry.tap = Object.assign(entry.tap, client.tap);
            data.push(entry);
        }
    }
    //console.log(data[0].motion);
    nsMonitor.emit("clients", data);

}, dataBroadcastInterval);



// Start the server.
httpsServer.listen(8080);