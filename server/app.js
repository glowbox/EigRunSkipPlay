require("dotenv").config();

const fs = require("fs");
const express = require("express");

const app = express();
const httpRedirectApp = express();

const http = require('http');
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
const httpServer = http.createServer(httpRedirectApp)

const io = require('socket.io')(httpsServer);

app.use(express.static('public'));

httpRedirectApp.use( (req, res, next) => {
    if(!req.secure) {
        console.log(`Redirecting HTTP request to HTTPS for url: ${req.url}`);
        
        let host = req.headers.host;

        // strip off the port number if it exists in the host address.
        if(host.indexOf(":") != -1) {
            host = host.substring(0, host.indexOf(":"));
        }

        let redirectUrl = `https://${host}`;

        // Add the https port number if it's not the default.
        if(process.env.HTTPS_SERVER_PORT != 443) {
            redirectUrl = redirectUrl + ":" + process.env.HTTPS_SERVER_PORT;
        }

        redirectUrl = `${redirectUrl}${req.url}`;
        
        return res.redirect(redirectUrl);
    }
    next();
});

const dataBroadcastInterval = 1000 / 5.0;


let clients = [];

for(var i = 0; i < 128; i++) {
    let id = i;
    clients[i] = {
        "id" : id,
        "socket" : null,
        "motion" : {},
        "tap" : {}
    };
}

//console.log(clients);


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
               // console.log(data);
               clients[id].motion = data;
            });

            socket.on("tap", (data) => {
                //console.log("Got taps from client " + id, data);
                clients[id].tap = data;
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

nsMonitor.on("connection", (socket) => {
    socket.on("color", (data) => {
        let index = data.id;
    
        if(index < 0 || index >= clients.length) {
            console.log("Set client color: invalid client index: " + index);
            return;
        }
    
        if(clients[index].socket != null){
            clients[index].socket.emit("color", data.rgb);
        } else {
            // console.log("Client not connected: " + index);
        }
    });
});


setInterval(() => {

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
httpsServer.listen(process.env.HTTPS_SERVER_PORT, () => {
    console.log(`HTTPS server listening on port ${process.env.HTTPS_SERVER_PORT}`);
});

httpServer.listen(process.env.HTTP_SERVER_PORT, () => {
    console.log(`HTTP Redirect server listening on port ${process.env.HTTP_SERVER_PORT}`);
});