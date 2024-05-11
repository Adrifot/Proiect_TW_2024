const express = require("express");
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sass = require('sass'); 
//const ejs = require('ejs');

const Client = require("pg").Client;

var client = new Client({
    user: "adrian",
    database: "bgshop",
    password: "admin",
    host: "localhost",
    port: 5432
});

client.connect();

objGlobal = {
    objErr: null,
    objImg: null,
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
    res.render("pages/index", {ip: req.ip, images: objGlobal.objImg.images});
});

app.get("/produse", (req, res) => {
    var conditionQuery = "";
    if(req.query.gen) conditionQuery = `where gen = '${req.query.gen}'`;
    client.query("select * from unnest(enum_range(null::genre))", (err, genres) => {
        if(err) console.log(err);
        client.query("select * from unnest(enum_range(null::theme))", (err2, themes) => {
            if(err2) console.log(err2);
            client.query("select * from unnest(enum_range(null::brand))", (err3, brands) => {
                if(err3) console.log(err3);
                client.query(`select * from produse ${conditionQuery}`, (dberr, dbres) => {
                    if(dberr) {
                        console.log(dberr);
                        throwError(dbres, 2);
                    } else {
                        res.render("pages/products", {products: dbres.rows, genres: genres.rows, themes: themes.rows, brands: brands.rows});
                    }
                });
            });
        });
    });
});

app.get("/produs/:id", (req, res) => {
    client.query(`select * from produse where id = ${req.params.id}`, (err, DBres) => {
        if(err) {
            console.log(err);
            throwError(res, 2);
        } else {
            res.render("pages/product", {product: DBres.rows[0]});
        }
    });
});

// BUCATA DE COD DE LA CURS/LAB CU PRAJITURI AND STUFF

// app.get("/produs/:id", function(req, res){
//     client.query(`select * from prajituri where id=${req.params.id}`, function(err, rez){
//         if(err){
//             console.log(err);
//             afisareEroare(res, 2);
//         }
//         else{
//             res.render("pages/produs", {prod: rez.rows[0]});
//         }
//     });
// });

// app.get("/produse", function(req, res){
//     console.log(req.query)
//     var conditieQuery="";
//     if (req.query.tip){
//         conditieQuery=` where tip_produs='${req.query.tip}'`
//     }
//     client.query("select * from unnest(enum_range(null::categ_prajitura))", function(err, rezOptiuni){
//         client.query(`select * from prajituri ${conditieQuery}`, function(err, rez){
//             if (err){
//                 console.log(err);
//                 throwError(res, 2);
//             }
//             else{
//                 res.render("pages/produse", {produse: rez.rows, optiuni: []});
//             }
//         })
//     });
// })
// // CODE END


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
        });
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

function initImg() {
    var content = fs.readFileSync(path.join(__dirname, "sources/json/gallery.json")).toString("utf-8");
    objGlobal.objImg = JSON.parse(content);

    let images = objGlobal.objImg.images;
    let absPath = path.join(__dirname, objGlobal.objImg.galleryPath);
    let absPathMedium = path.join(__dirname, objGlobal.objImg.galleryPath, "medium");
    
    if(!fs.existsSync(absPathMedium)) fs.mkdirSync(absPathMedium);

    for(let image of images) {
        [fileName, ext] = image.filename.split(".");
        let absFilePath = path.join(absPath, image.filename);
        let absFilePathMedium = path.join(absPathMedium, fileName+".webp");
        sharp(absFilePath).resize(300).toFile(absFilePathMedium);
        image.filename_medium = path.join("/", objGlobal.objImg.galleryPath, "medium", fileName+".webp");
        image.filename = path.join("/", objGlobal.objImg.galleryPath, image.filename);
    }
}

initImg();
initErr();

app.listen(8080);
console.log("Server started up.");
