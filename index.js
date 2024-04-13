const express = require("express");
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sass = require('sass'); 
//const ejs = require('ejs');

objGlobal = {
    objErr: null,
    objImgL: null,
    sassFolder: path.join(__dirname, "sources/scss"),
    cssFolder: path.join(__dirname, "sources/css"),
    backupFolder: path.join(__dirname, "backup")
}

folders = ["temp", "backup"];
for(let folder of folders) {
    let folderPath = path.join(__dirname, folder);
    if(!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
}

const app = express();
console.log("Project folder: ", __dirname);
console.log("File path: ", __filename);
console.log("Working directory: ", process.cwd());

app.set("view engine", "ejs");

app.use("/sources", express.static(path.join(__dirname, "sources")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));

app.get(["/", "/index", "/home"], (req, res) => {
    res.render("pages/index", {ip: req.ip});
});

app.get("/currdate", function(req, res) {
    res.write("Current date: ");
    res.write(Date());
    res.end();
});

app.get("/mathsum/:a/:b", function(req, res) {
    var suma = req.params.a*1 + req.params.b*1;
    res.send(""+suma);
});

app.get("/*.ejs", (req, res) => {
    throwError(res, 400);
});

app.get(new RegExp("^\/[A-Za-z\/0-9]*\/$"), function(req, res){
    throwError(res, 403);
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"sources/ico/favicon.ico"));
});

app.get("/*", (req, res) => {
    try {
        res.render("pages"+req.url, (err, reshtml) => {
            if(err) {
                if(err.message.startsWith("Failed to lookup view")) {
                    throwError(res, 404);
                    console.log("Page not found: ", req.url);
                }
            }
        })
    } catch(err1) {
        if(err1.message.startsWith("Cannot find module")) {
            throwError(res, 404);
            console.log("Resource not found: ", req.url);
        } else {
            throwError(res);
            console.log("Error: ", err1);
        }
    }
});

function initErr(){
    var content = fs.readFileSync(path.join(__dirname,"sources/json/errors.json")).toString();
    objGlobal.objErr = JSON.parse(content);
    for(let error of objGlobal.objErr.errInfo) error.image = path.join(objGlobal.objErr.basePath, error.image);
    objGlobal.objErr.defaultErr = path.join(objGlobal.objErr.basePath, objGlobal.objErr.defaultErr.image);
}

function throwError(res, _id, _title, _text, _image){
    let error = objGlobal.objErr.errInfo.find(
        function(elem) {
            return elem.id == _id;
        }
    )
    if (!error) {
        let defaultErr = objGlobal.objErr.defaultErr;
        res.render("pages/error", {
            title: _title || defaultErr.title,
            text: _text || defaultErr.text,
            image: _image || defaultErr.image
        });
    } else {
        if(error.status){
            res.status(error.id);
        }
        res.render("pages/error", {
            title: _title || error.title,
            text: _text || error.text,
            image: _image || error.image
        }); 
    }
}

function compileSass(sassPath, cssPath) {
    if(!cssPath) cssPath = path.basename(sassPath).split(".")[0] + ".css";
    if(!path.isAbsolute(sassPath)) sassPath = path.join(objGlobal.sassFolder, sassPath);
    if(!path.isAbsolute(cssPath)) cssPath = path.join(objGlobal.cssFolder, cssPath);
    
    let backupPath = path.join(objGlobal.backupFolder, "sources/css");
    if(!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, {recursive: true});

    let cssFolderName = path.basename(cssPath);
    if(fs.existsSync(cssPath)) fs.copyFileSync(cssPath, path.join(objGlobal.backupFolder, "sources/css", cssFolderName));
    resultFolder = sass.compile(sassPath, {"sourceMap": true});
    fs.writeFileSync(cssPath, resultFolder.css);
}

folders = fs.readdirSync(objGlobal.sassFolder);
for(let folder of folders) {
    if(path.extname(folder) == ".scss") compileSass(folder);
}

fs.watch(objGlobal.sassFolder, (ev, fold) => {
    console.log(ev, fold);
    if(ev == "change" || ev == "rename") {
        let fullPath = path.join(objGlobal.sassFolder, fold);
        if(fs.existsSync(fullPath)) compileSass(fullPath);
    }
});

initErr();

app.listen(8080);
console.log("Server started up.");
