// index.js

const express = require("express");
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sass = require('sass'); 
const ejs = require('ejs');
const BDAccess = require("./modules/bdaccess.js");
const formidable = require("formidable");
const {User} = require("./modules/user.js")
const session = require('express-session');
const Rights = require("./modules/rights.js");
const Client = require("pg").Client;

const app = express();

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
    backupFolder: path.join(__dirname, "backup"),
    menuOptions: [],
    protocol: "http://",
    domainName: "localhost:8080"
}

client.query("select * from unnest(enum_range(null::genre))", (err, categRes) => {
    if(err) console.log(err);
    else objGlobal.menuOptions = categRes.rows;
    //console.log(objGlobal.menuOptions);
});

app.use(session({
    secret: "abcdefg",
    resave: true,
    saveUninitialized: false
}));

app.use("/*", function(req, res, next) {
    res.locals.menuOptions = objGlobal.menuOptions;
    res.locals.Rights = Rights;
    if(req.session.user) req.user = res.locals.user = new User(req.session.user);
    next();
});

folders = ["temp", "backup", "uploaded_photos"];
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
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use("uploaded_photos", express.static(__dirname + "/uploaded_photos"));

app.get(["/", "/index", "/home"], (req, res) => {
    client.query("select * from produse", (err, prods) => {
        if(err) console.log(err);
        else res.render("pages/index", {ip: req.ip, images: objGlobal.objImg.images, prods: prods.rows});
    });
});

app.get("/produse", (req, res) => {
    var conditionQuery = "";
    if(req.query.gen) conditionQuery = `where gen = '${req.query.gen}'`;
    //client.query("select * from unnest(enum_range(null::genre))", (err, genres) => {
        //if(err) console.log(err);
        client.query("select * from unnest(enum_range(null::theme))", (err2, themes) => {
            if(err2) console.log(err2);
            client.query("select * from unnest(enum_range(null::brand))", (err3, brands) => {
                if(err3) console.log(err3);
                client.query(`select * from produse ${conditionQuery}`, (dberr, dbres) => {
                    if(dberr) {
                        console.log(dberr);
                        throwError(dbres, 2);
                    } else {
                        res.render("pages/products", {products: dbres.rows, themes: themes.rows, brands: brands.rows});
                    }
                });
            });
        });
    //});
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

app.get("/register", (req, res) => {
    res.render("pages/register");
});

app.post("/register", (req, res) => {
    let username, photo;
    let form = new formidable.IncomingForm();
    form.parse(req, function(err, txtFields, fileFields) {
        let myerr = "";

        let newUser = new User();

        try {
            newUser.setName = txtFields.name[0];
            newUser.setUsername = txtFields.username[0];
            newUser.email = txtFields.email[0];
            newUser.surname = txtFields.surname[0];
            newUser.pswd = txtFields.pswd[0];
            newUser.chatColor = txtFields.chatColor[0];
            newUser.photo = photo;

            User.getUserByUsername(txtFields.username[0], {}, function(u, param, usrerr) {
                if(usrerr == -1) {
                    newUser.saveUser();
                    res.render("pages/register", {answer: "Inregistrare cu succes!"});
                } else {
                    myerr += "Username already exists.";
                    res.render("pages/register", {err: "Eroare: " + myerr});
                }
            });
        } catch(e) {
            console.log(e);
            myerr += "Website error";
            res.render("pages/register", {err: "Eroare: " + myerr});
        }
    });

    form.on("field", function(name, val) {  
        if(name == "username")
            username = val;
    });

    form.on("fileBegin", function(name, file) {
        let folderUser = path.join(__dirname, "uploaded_photos", username);
        if (!fs.existsSync(folderUser)) fs.mkdirSync(folderUser);
        file.filepath = path.join(folderUser, file.originalFilename);
        photo = file.originalFilename;
    });

    form.on("file", function(name, file) {
        console.log("file");
        console.log(name, file);
    });
});

app.post("/login", (req, res) => {
    let username;
    let form = new formidable.IncomingForm();

    form.parse(req, (err, txtFields, fileFields) => {
        let callbackParams = {
            req: req,
            res: res,
            pswd: txtFields.pswd[0]
        };

        User.getUserByUsername(txtFields.username[0], callbackParams, function(u, params, err) {
            if (err) {
                console.log("Error retrieving user:", err);
                params.req.session.loginmsg = "Error retrieving user.";
                params.res.redirect("/index");
                return;
            }
            if (!u) {
                console.log("User not found.");
                params.req.session.loginmsg = "User not found.";
                params.res.redirect("/index");
                return;
            }

            let encryptedPswd = User.encryptPswd(params.pswd);
            if (u.parola === encryptedPswd) {
                u.photo = u.photo ? path.join("uploaded_photos", u.username, u.photo) : "";
                params.req.session.user = u;
                params.req.session.loginmsg = "You have been logged in!";
                params.res.redirect("/index");
            } else {
                console.log("Incorrect password.");
                params.req.session.loginmsg = "Incorrect password or email not confirmed!";
                params.res.redirect("/index");
            }
        });
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.locals.user = null;
    res.render("pages/logout");
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

    if(fs.existsSync(cssPath)) {
        let timestamp = new Date().toISOString().replace(/[:.T]/g, "-");
        let backupFile = `${path.basename(cssPath, ".css")}-${timestamp}.css`;
        fs.copyFileSync(cssPath, path.join(objGlobal.backupFolder, "sources/css", backupFile));
       // fs.copyFileSync(cssPath, path.join(objGlobal.backupFolder, "sources/css", cssFolderName));
    }
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
