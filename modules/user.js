// user.js
const BDAccess = require("./bdaccess.js");
const pswds = require("./pswds.js");
const { RoleFactory } = require("./roles.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * Represents a user in the system.
 */
class User {
    /**
     * @type {string} - Type of connection for database access.
     */
    static connectionType = "local";

    /**
     * @type {string} - Name of the table storing user data.
     */
    static table = "utilizatori";

    /**
     * @type {string} - Encryption key for password hashing.
     */
    static pswdcrypt = "tehniciweb";

    /**
     * @type {string} - Email server used for sending emails.
     */
    static emailServer = "fam.testing.unibucfmi@gmail.com";

    /**
     * @type {number} - Length of the encryption code.
     */
    static codeLength = 32;

    /**
     * @type {string} - Domain name for generating URLs.
     */
    static domainName = "localhost:8080";

    #error;

    /**
     * Constructs a new User object.
     * @param {object} param0 - Object containing user properties.
     * @param {number} param0.id - User ID.
     * @param {string} param0.username - User's username.
     * @param {string} param0.name - User's first name.
     * @param {string} param0.surname - User's last name.
     * @param {string} param0.email - User's email address.
     * @param {string} param0.pswd - User's password.
     * @param {object|string} param0.rol - User's role object or role code.
     * @param {string} [param0.chatColor="black"] - User's chat color.
     * @param {string} param0.photo - URL or path to user's profile photo.
     */
    constructor({ id, username, name, surname, email, pswd, rol, chatColor = "black", photo } = {}) {
        this.id = id;
        try {
            if (this.checkUsername(username)) this.username = username;
            else throw new Error("Invalid username.");
        } catch (e) {
            this.#error = e.message;
        }

        for (let prop in arguments[0]) this[prop] = arguments[0][prop];

        if (this.role) {
            this.role = this.rol.code ? RoleFactory.makeRole(this.role.code) : RoleFactory.makeRole(this.role);
        }
    }

    /**
     * Checks if a name is valid.
     * @param {string} name - Name to be checked.
     * @returns {boolean} True if the name is valid, false otherwise.
     */
    checkName(name) {
        return name != "" && name.match(new RegExp("^[A-Z][a-z]+$"));
    }

    /**
     * Setter for the user's name.
     * @param {string} name - New name to be set.
     * @throws {Error} Throws an error if the name is invalid.
     */
    set setName(name) {
        if (this.checkName(name)) this.name = name;
        else throw new Error("Invalid name.");
    }

    /**
     * Checks if a username is valid.
     * @param {string} username - Username to be checked.
     * @returns {boolean} True if the username is valid, false otherwise.
     */
    checkUsername(username) {
        return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
    }

    /**
     * Setter for the user's username.
     * @param {string} username - New username to be set.
     * @throws {Error} Throws an error if the username is invalid.
     */
    set setUsername(username) {
        if (this.checkUsername(username)) this.username = username;
        else throw new Error("Invalid username.");
    }

    /**
     * Encrypts a password using scrypt hashing.
     * @param {string} pswd - Password to be encrypted.
     * @returns {string} Encrypted password as hexadecimal string.
     */
    static encryptPswd(pswd) {
        return crypto.scryptSync(pswd, User.pswdcrypt, User.codeLength).toString("hex");
    }

    /**
     * Saves the user data to the database and sends a confirmation email.
     */
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
            }
        }, function (err, res) {
            if (err) {
                console.error("Database insertion error:", err);
            } else {
                usr.sendEMail("V-ati inregistrat cu succes.", "Username-ul dvs. ete " + usr.username,
                    `<h1>Salutari!</h1><p style='color:black'>Username-ul dvs. este <b style='color: green'>${usr.username}.</b></p>
                    <p><a href='http://${User.domainName}/cod/${usr.username}/${token}'>Click aici pentru confirmare.</a></p>
                    <p><small style='color: gray'>Acesta este un email automatizat. Va rugam sa nu raspundeti la el.<small/></p>`
                ).catch(e => {
                    console.error("Email sending error:", e);
                });
            }
        });
    }

    /**
     * Asynchronously sends an email to the user.
     * @param {string} subject - Email subject.
     * @param {string} txtmsg - Plain text email content.
     * @param {string} htmlmsg - HTML email content.
     * @param {object[]} [attachments=[]] - Array of email attachments.
     * @returns {Promise<void>} Promise that resolves when the email is sent.
     */
    async sendEMail(subject, txtmsg, htmlmsg, attachments = []) {
        let transp = nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth: {
                user: User.emailServer,
                pass: "slrpwiyrnhnobhsv"
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    
        try {
            await transp.sendMail({
                from: User.emailServer,
                to: this.email,
                subject: subject,
                text: txtmsg,
                html: htmlmsg,
                attachments: attachments
            });
            console.log("Email sent.");
        } catch (e) {
            console.error("Error sending email:", e);
        }
    }

    /**
     * Retrieves a user from the database asynchronously by username.
     * @param {string} username - Username of the user to retrieve.
     * @returns {Promise<User|null>} Promise that resolves with the User object if found, otherwise null.
     */
    static async getUserByUsernameAsync(username) {
        if (!username) return null;
        try {
            let selectRes = await BDAccess.getInstance(User.connectionType).selectAsync({
                table: "utilizatori",
                fields: ['*'],
                conditions_and: [`username='${username}'`]
            });
            if (selectRes.rowCount != 0) return new User(selectRes.rows[0]);
            else {
                console.log("getUserByUsernameAsync: user not found.");
                return null;
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * Retrieves a user from the database synchronously by username.
     * @param {string} username - Username of the user to retrieve.
     * @param {*} params - Additional parameters for user processing.
     * @param {function(User, *, number)} userProcess - Callback function for processing the retrieved user.
     */
    static getUserByUsername(username, params, userProcess) {
        if (!username) return null;
        let myerr = null;
        BDAccess.getInstance(User.connectionType).select({
            table: "utilizatori",
            fields: ['*'],
            conditions_and: [`username='${username}'`]
        }, function (err, selectRes) {
            if (err) {
                console.error("User: ", err);
                myerr = -2;
            } else if (selectRes.rowCount == 0) myerr = -1;
            let u = new User(selectRes.rows[0]);
            userProcess(u, params, myerr);
        });
    }

    /**
     * Checks if the user has a specific right.
     * @param {string} right - Right to check.
     * @returns {boolean} True if the user has the specified right, false otherwise.
     */
    hasRight(right) {
        return this.role.hasRight(right);
    }
}

module.exports = { User: User };
