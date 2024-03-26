const express = require("express");
const fs = require('fs');
//const path = require('path');
//const sharp = require('sharp');
//const sass = require('sass'); 
//const ejs = require('ejs');


const app = express();
console.log("Project folder: ", __dirname);
console.log("File path: ", __filename);
console.log("Working directory: ", process.cwd());

app.set("view engine","ejs");

app.use("/sources", express.static(__dirname+"/sources"));

app.get("/cerere", function(req, res) {
    res.send("<h1 align='center'>Hi<h1/>");
});

app.get("/data", function(req, res, next) {
    res.write("Current date: ");
});

app.get("/data", function(req, res) {
    res.write(Date());
    res.end();
});

app.get("/suma/:a/:b", function(req, res) {
    var suma = req.params.a*1 + req.params.b*1;
    res.send(""+suma);
});

// app.get("/", function(req, res) {
//     res.sendFile(__dirname+"/index.html");
// });

app.get(["/", "/index", "/home"], (req, res) => {
    res.render("pages/index");
});

app.get("/*", (req, res) => {
    res.render("pages"+req.url, (result, err)=>{
        res.send(result.toString("utf-8"));
    });
});

app.listen(8080);
console.log("Server started up.");
