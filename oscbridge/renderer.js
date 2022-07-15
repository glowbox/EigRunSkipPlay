// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering

function valueToHex(value){
    let base16 = value.toString(16);
    return (base16.length == 1) ? "0" + base16 : base16;
}

function smoothstep (min, max, value) {
    var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x);
};

function makeValueDiv(color, min, max, value) {
    let div = document.createElement("div");
    let v = smoothstep(min, max, value);
    div.className = "value"
    div.style.height =  (v*20)+ "px";
    div.style.width = "10px";
    div.style.backgroundColor = color;
    return div;
}

function makeGraphNode() {
    let cell = document.createElement("td");
    let container = document.createElement("div");
    container.classList.add("graph-values");
    let result = {
        "cell" : cell,
        "container" : container,
        "values" : []
    };

    for(var i = 0; i < 3; i++){
        let div = document.createElement("div");
        container.appendChild(div);
        result.values.push(div);
    }
    cell.appendChild(container);

    return result;
}

let rowCount = 128;

let broadcastInterval = (1000 / 5);

let table = document.getElementById("data");
let zoneTable = document.getElementById("zone-data");
let status = document.getElementById("status");
let rowElements = [];
let zoneElements = [];

status.innerHTML = "Starting up...";

table.innerHTML = "";

for(var i = 0; i < rowCount; i++) {
    let tr = document.createElement("tr");
    let entry = {
        "id" : document.createElement("td"),
        "zone" : document.createElement("td"),
        "tap" : document.createElement("td"),

        "rotation" : makeGraphNode(),
        "acceleration" : makeGraphNode(),
        "orientation" : makeGraphNode(),
        "row" : tr,
        "color": ""
    };

    tr.appendChild(entry.id);
    tr.appendChild(entry.zone);
    tr.appendChild(entry.tap);

    tr.appendChild(entry.rotation.cell);
    tr.appendChild(entry.acceleration.cell);
    tr.appendChild(entry.orientation.cell);

    let colorPickerCell = document.createElement("td");
    let colorPicker = document.createElement("input");
    colorPicker.type = "color";
    let index = i;
    colorPicker.addEventListener("change", (event) => {

        let color = event.target.value;
        color = color.replace("#", "");

        let r = color.substring(0, 2);
        let g = color.substring(2, 4);
        let b = color.substring(4);

        let rFloat = parseInt(r, 16);
        let gFloat = parseInt(g, 16);
        let bFloat = parseInt(b, 16);
        
        let clientId = entry.row.value;
        let message = {
            "id" : clientId,
            "rgb" : [rFloat, gFloat, bFloat]
        };

        window.electronAPI.sendWSMessage( {msg: "color", data: message});
        
    });

    colorPickerCell.appendChild(colorPicker);
    tr.appendChild(colorPickerCell);

    /*entry.rotation.classList.add("graph-cell");
    entry.acceleration.classList.add("graph-cell");
    entry.orientation.classList.add("graph-cell");*/

    rowElements.push( entry );
    table.appendChild(tr);
}

for(var i = 0; i < 5; i++) {
    let tr = document.createElement("tr");
    let entry = {
        "zone" : document.createElement("td"),
        "clients" : document.createElement("td"),
        "tap" : document.createElement("td"),
        "rotation" : makeGraphNode(),
        "acceleration" : makeGraphNode(),
        "orientation" : makeGraphNode(),
        "color": ""
    };

    tr.appendChild(entry.zone);
    tr.appendChild(entry.clients);
    tr.appendChild(entry.tap);

    tr.appendChild(entry.rotation.cell);
    tr.appendChild(entry.acceleration.cell);
    tr.appendChild(entry.orientation.cell);

    let colorPickerCell = document.createElement("td");
    let colorPicker = document.createElement("input");
    colorPicker.type = "color";
    let index = i;
    
    colorPicker.addEventListener("change", (event) => {

        console.log("zone color");
        console.log(event);

        let color = event.target.value;
        color = color.replace("#", "");

        let r = color.substring(0, 2);
        let g = color.substring(2, 4);
        let b = color.substring(4);

        let rFloat = parseInt(r, 16);
        let gFloat = parseInt(g, 16);
        let bFloat = parseInt(b, 16);
        
        let zoneId = index;
        let message = {
            "zone" : zoneId,
            "rgb" : [rFloat, gFloat, bFloat]
        };
        
        window.electronAPI.sendWSMessage( {msg: "color", data: message});

    });
    
    entry.colorPicker = colorPicker;
    colorPickerCell.appendChild(colorPicker);
    tr.appendChild(colorPickerCell);

    zoneElements.push( entry );
    zoneTable.appendChild(tr);
}

window.electronAPI.onZones((_event, data) => {

    for(var i = 0; i < data.length; i++) {
        zoneElements[i].zone.innerHTML = i;
        zoneElements[i].clients.innerHTML = data[i].clients;
        
        let r = valueToHex(data[i].rgb[0]);
        let g = valueToHex(data[i].rgb[1]);
        let b = valueToHex(data[i].rgb[2]);

        var newcolor = `#${r}${g}${b}`;
        if( zoneElements[i].color != newcolor ){
            zoneElements[i].colorPicker.value = `#${r}${g}${b}`;
            zoneElements[i].color = newcolor;
        }

        //rowElements[i].acceleration.innerHTML = "";
        if(data[i].motion.hasOwnProperty("acceleration")){
            for(var n = 0; n < 3; n++) {
                zoneElements[i].acceleration.values[n].style.backgroundColor = "red";
                zoneElements[i].acceleration.values[n].style.height = (smoothstep(0, 5, Math.abs(data[i].motion.acceleration[n])) * 20) + "px";
            }
        }

        if(data[i].motion.hasOwnProperty("rotationRate")){
            for(var n = 0; n < 3; n++) {
                zoneElements[i].rotation.values[n].style.backgroundColor = "red";
                zoneElements[i].rotation.values[n].style.height = (smoothstep(0, 90, Math.abs(data[i].motion.rotationRate[n])) * 20) + "px";
            }
        }

        if(data[i].motion.hasOwnProperty("orientation")){
            for(var n = 0; n < 3; n++) {
                zoneElements[i].orientation.values[n].style.backgroundColor = "red";
                zoneElements[i].orientation.values[n].style.height = (smoothstep(-180, 180, data[i].motion.orientation[n])) * 20 + "px";
            }
        }

        if(data[i].tap.hasOwnProperty("count")){
            zoneElements[i].tap.innerHTML = data[i].tap.count + ", " + data[i].tap.rate.toFixed(2);
        }

    }

});

window.electronAPI.onClients((_event, data) => {
    
    status.innerHTML = `${data.length} clients connected`;
    
    for(var i = 0; i < data.length; i++) {
        rowElements[i].row.value = data[i].id;
        rowElements[i].id.innerHTML = data[i].id;
        rowElements[i].zone.innerHTML = data[i].zone;
        
        //rowElements[i].acceleration.innerHTML = "";
        if(data[i].motion.hasOwnProperty("acceleration")){
            for(var n = 0; n < 3; n++) {
                rowElements[i].acceleration.values[n].style.backgroundColor = "red";
                rowElements[i].acceleration.values[n].style.height = (smoothstep(0, 5, Math.abs(data[i].motion.acceleration[n])) * 20) + "px";
            }
        }

        if(data[i].motion.hasOwnProperty("rotationRate")){
            for(var n = 0; n < 3; n++) {
                rowElements[i].rotation.values[n].style.backgroundColor = "red";
                rowElements[i].rotation.values[n].style.height = (smoothstep(0, 90, Math.abs(data[i].motion.rotationRate[n])) * 20) + "px";
            }
        }

        if(data[i].motion.hasOwnProperty("orientation")){
            for(var n = 0; n < 3; n++) {
                rowElements[i].orientation.values[n].style.backgroundColor = "red";
                rowElements[i].orientation.values[n].style.height = (smoothstep(-180, 180, data[i].motion.orientation[n])) * 20 + "px";
            }
        }

        if(data[i].tap.hasOwnProperty("count")){
            rowElements[i].tap.innerHTML = data[i].tap.count + ", " + data[i].tap.rate.toFixed(2);
        }

        

        /*rowElements[i].rotation.innerHTML = "";
        if(data[i].motion.hasOwnProperty("rotationRate")){
            rowElements[i].rotation.appendChild(makeValueDiv("blue", 0, 200, Math.abs(data[i].motion.rotationRate[0])));
            rowElements[i].rotation.appendChild(makeValueDiv("blue", 0, 200, Math.abs(data[i].motion.rotationRate[1])));
            rowElements[i].rotation.appendChild(makeValueDiv("blue", 0, 200, Math.abs(data[i].motion.rotationRate[2])));
        }

        rowElements[i].orientation.innerHTML = "";
        if(data[i].motion.hasOwnProperty("orientation")){
            rowElements[i].orientation.appendChild(makeValueDiv("green", 0, 360, Math.abs(data[i].motion.orientation[0])));
            rowElements[i].orientation.appendChild(makeValueDiv("green", 0, 360, Math.abs(data[i].motion.orientation[1])));
            rowElements[i].orientation.appendChild(makeValueDiv("green", 0, 360, Math.abs(data[i].motion.orientation[2])));
        }*/

        //rowElements[i].tap.innerHTML = "";
    }

    for(var i = data.length; i < rowElements.length; i++) {
        rowElements[i].id.innerHTML = "-";
        rowElements[i].zone.innerHTML = "";
        rowElements[i].acceleration.innerHTML = "";
        rowElements[i].rotation.innerHTML = "";
        rowElements[i].orientation.innerHTML = "";
        rowElements[i].tap.innerHTML = "";
    }
})