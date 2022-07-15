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
let zones = [];
    


for(var i = 0; i < 128; i++) {
    let id = i;
    clients[i] = {
        "id" : id,
        "socket" : null,
        "motion" : {},
        "tap" : {}
    };
}


for(var i = 0; i < 5; i++) {
    zones.push({
        "rgb" : [Math.floor(Math.random() * 255), 128, Math.floor(Math.random() * 255)],
        "clients" : 0,
        "tap" : {
            "count" : 0,
            "rate" : 0
        },
        "motion" : {
            "accelerationMagnitude" : 0,
            "acceleration" : [0,0,0],
            "orientation"  : [0,0,0],
            "rotation"     : [0,0,0]
        }        
    });
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

                if((data.joining >= 0) && (data.joining < zones.length)) {
                    clients[id].socket.emit("color", zones[data.joining].rgb);
                }
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

        if(data.hasOwnProperty("zone")) {
            if((data.zone >= 0) && (data.zone < zones.length)) { 

                zones[data.zone].rgb = data.rgb;

                for(var i = 0; i < clients.length; i++) {
                    if((clients[i].socket != null) && (clients[i].zone == data.zone)) {
                        clients[i].socket.emit("color", data.rgb);
                    }
                }
            }
        } else {

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
        }

    });
});


function sumArrayElements(destination, source) {
    for(var i = 0; i < destination.length; i++) {
        destination[i] += source[i];
    }
}


setInterval(() => {

    // Reset zone aggregate values as they will be updated
    // when iterating through the client list.
    for(var i = 0; i < 5; i++) {
        zones[i].clients = 0;
        
        zones[i].tap = {
            "count" : 0,
            "rate" : 0
        };

        zones[i].motion = {
            "accelerationMagnitude" : 0,
            "acceleration" : [0,0,0],
            "orientation"  : [0,0,0],
            "rotationRate" : [0,0,0]
        };
    }

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
            
            let z = clients[i].zone;
            if((z >= 0) && (z < zones.length)) {                
                zones[z].clients++;

                zones[z].tap.count += clients[i].tap.count;
                zones[z].tap.rate += clients[i].tap.rate;

                let ax = clients[i].motion.acceleration[0];
                let ay = clients[i].motion.acceleration[1];
                let az = clients[i].motion.acceleration[2];

                zones[z].motion.accelerationMagnitude += Math.sqrt( (ax*ax) + (ay*ay) + (az*az) );

                sumArrayElements(zones[z].motion.acceleration, clients[i].motion.acceleration);
                sumArrayElements(zones[z].motion.orientation,  clients[i].motion.orientation);
                sumArrayElements(zones[z].motion.rotationRate,     clients[i].motion.rotationRate);
            }
        }
    }

    nsMonitor.emit("clients", data);

    // Compute averages per-zone.
    for(var z = 0; z < 5; z++) {
        if(zones[z].clients > 0) {
            let c = zones[z].clients;

            // note, tap count is not averaged, it's a sum total of all taps.

            zones[z].tap.rate /= c;

            zones[z].motion.accelerationMagnitude /= c;

            zones[z].motion.acceleration[0] /= c;
            zones[z].motion.acceleration[1] /= c;
            zones[z].motion.acceleration[2] /= c;

            zones[z].motion.orientation[0] /= c;
            zones[z].motion.orientation[1] /= c;
            zones[z].motion.orientation[2] /= c;

            zones[z].motion.rotationRate[0] /= c;
            zones[z].motion.rotationRate[1] /= c;
            zones[z].motion.rotationRate[2] /= c;
        }
    }

    nsMonitor.emit("zones", zones);

}, dataBroadcastInterval);



// Start the server.
httpsServer.listen(process.env.HTTPS_SERVER_PORT, () => {
    console.log(`HTTPS server listening on port ${process.env.HTTPS_SERVER_PORT}`);
});

httpServer.listen(process.env.HTTP_SERVER_PORT, () => {
    console.log(`HTTP Redirect server listening on port ${process.env.HTTP_SERVER_PORT}`);
});