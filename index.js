const express = require("express");
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sass = require('sass'); 
const ejs = require('ejs');
//const bootstrap = require("bootstrap");

const app = express();

const AccesBD= require("./modules/accesbd.js");
const formidable=require("formidable");
const {Utilizator}=require("./modules/utilizator.js")
const session=require('express-session');
const Drepturi = require("./modules/drepturi.js");

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

folders = ["temp", "backup", "uploads"];
for(let folder of folders) {
    let folderPath = path.join(__dirname, folder);
    if(!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
}

console.log("Project folder: ", __dirname);
console.log("File path: ", __filename);
console.log("Working directory: ", process.cwd());

app.set("view engine", "ejs");

app.use("/sources", express.static(path.join(__dirname, "sources")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use(
    express.static(path.join(__dirname, "node_modules/bootstrap/dist/"))
  );

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


//COD LABORATOR START
app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
  }));

  app.post("/inregistrare",function(req, res){
    var username;
    var poza;
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        console.log("Inregistrare:",campuriText);


        console.log(campuriFisier);
        console.log(poza, username);
        var eroare="";


        // TO DO var utilizNou = creare utilizator
        var utilizNou = new Utilizator();
        try{
            utilizNou.setareNume=campuriText.nume;
            utilizNou.setareUsername=campuriText.username;
            utilizNou.email=campuriText.email
            utilizNou.prenume=campuriText.prenume
           
            utilizNou.parola=campuriText.parola;
            utilizNou.culoare_chat=campuriText.culoare_chat;
            utilizNou.poza= poza;
            Utilizator.getUtilizDupaUsername(campuriText.username, {}, function(u, parametru ,eroareUser ){
                if (eroareUser==-1){//nu exista username-ul in BD
                    //TO DO salveaza utilizator
                    utilizNou.salvareUtilizator
                }
                else{
                    eroare+="Mai exista username-ul";
                }


                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!"})
                   
                }
                else
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
            })
           


        }
        catch(e){
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare})
        }

    });
    formular.on("field", function(nume,val){  // 1
   
        console.log(`--- ${nume}=${val}`);
       
        if(nume=="username")
            username=val;
    })
    formular.on("fileBegin", function(nume,fisier){ //2
        console.log("fileBegin");
       
        console.log(nume,fisier);
        //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
        
        //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
        var folderUser;
       
        fisier.filepath=path.join(folderUser, fisier.originalFilename)
        poza=fisier.originalFilename;
        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",fisier)


    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier); 
    });
});
//COD DE LABORATOR END

initImg();
initErr();

app.listen(8080);
console.log("Server started up.");
