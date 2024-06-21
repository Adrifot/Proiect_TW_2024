const BDAccess = require("./bdaccess.js");
const pswds = require("./pswds.js");
const {RoleFactory} = require("./roles.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

class User {
    static connectionType = "local";
    static table = "utilizatori";
    static pswdcrypt = "tehniciweb";
    static emailServer = "fam.testing.unibucfmi@gmail.com";
    static codeLength = 64;
    static domainName = "localhost:8080";
    #error;

    constructor({id, username, name, surname, email, pswd, rol, chatColor = "black", photo} = {}) {
        this.id = id;
        try {
            if(this.checkUsername(username)) this.username = username;
            else throw new Error("Invalid username.");
        } catch(e) {
            this.#error = e.message;
        }

        for(let prop in arguments[0]) this[prop] = arguments[0][prop]
        
        if(this.role) {
            this.role = this.rol.code ? RoleFactory.makeRole(this.role.code) : RoleFactory.makeRole(this.role);
        }
    }

    checkName(name) {
        return name != "" && name.match(new RegExp("^[A-Z][a-z]+$"));
    }

    set setName(name) {
        if(this.checkName(name)) this.name = name;
        else throw new Error("Invalid name.");
    }

    checkUsername(username) {
        return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
    }

    set setUsername(username) {
        if(this.checkUsername(username)) this.username = username;
        else throw new Error("Invalid username.");
    }

    static encryptPswd(pswd) {
        return crypto.scryptSync(pswd, User.pswdcrypt, User.codeLength).toString("hex");
    }

    saveUser() {
        let encryptedPswd = User.encryptPswd(this.pswd);
        let usr = this;
        let token = pswds.generateToken(100);
        BDAccess.getInstance(User.connectionType).insert({
                table: User.table,
                fields: {
                    username: this.username,
                    nume: this.surname,
                    prenume: this.name,
                    parola: encryptedPswd,
                    email: this.email,
                    culoare_chat: this.chatColor,
                    cod: token,
                    poza: this.photo
                }, 
                function(err, res) {
                    if(err) console.log(err);
                    else usr.sendEMail("V-ati inregistrat cu succes.", "Username-ul dvs. ete " + usr.username, 
                        `<h1>Salutari!</h1><p style='color:blue'>Username-ul dvs, este ${usr.username}.</p>
                        <p><a href='http://${User.domainName}/cod/${usr.username}/${token}'>Click aici pentru confirmare.</a></p>`
                    )
                }
            });
    }

    async sendEMail(subject, txtmsg, htmlmsg, attachments=[]) {
        let transp = nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth: {
                user: User.emailServer,
                pass: "chipichapa"
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transp.sendMail({
            from: User.emailServer,
            to: this.email,
            subject: subject,
            text: txtmsh,
            html: htmlmsg,
            attachments: attachments
        });

        console.log("Email sent.");
    }

    static async getUserByUsernameAsync(username) {
        if(!username) return null;
        try {
            let selectRes = await BDAccess.getInstance(User.connectionType).selectAsync({
                table: "utilizatori",
                fields: ['*'],
                conditions_and: [`username='${username}'`]
            });
            if(selectRes.rowCount != 0) return new User(selectRes.rows[0]);
            else {
                console.log("getUserByUsernameAsync: user not found.");
                return null;
            }
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    static getUserByUsername(username, params, userProcess) {
        if(!username) return null;
        let myerr = null;
        BDAccess.getInstance(User.connectionType).select({
            table: "utilizatori",
            fields: ['*'],
            conditions_and: [`username='${username}'`]
        }, function(err, selectRes) {
            if(err) {
                console.error("User: ", err);
                myerr = -2;
            } else if(selectRes.rowCount == 0) myerr = -1;
            let u = new User(selectRes.rows[0]);
            userProcess(u, params, myerr);
        });
    }

    hasRight(right) {
        return this.role.hasRight(right);
    }
}

module.exports = {User: User}