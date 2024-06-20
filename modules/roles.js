const { Client } = require("pg");
const Rights = require("./rights.js");

class Role {
    static get type() {return "generic"}
    static get roles() {return []}

    constructor() {
        thic.code = this.constructor.type;
    }

    hasRight(right) {
        return this.constructor.rights.includes(right);
    }
}

class AdminRole extends Role {
    static get type() {return "admin"}

    constructor() {super()}

    hasRight() {return true}
}

class ModeratorRole extends Role {
    static get type() {return "moderator"}
    static get rights() {
        return [
            Rights.viewUsers,
            Rights.deleteUsers
        ]
    }

    constructor() {super()}
}

class ClientRole extends Role {
    static get type() {return "common"}
    static get rights() {
        return [Rights.buyProducts];
    }

    constructor() {super()}
}

class RoleFactory {
    static makeRole(type) {
        switch(type) {
            case AdminRole.type:
                return new AdminRole();
            case ModeratorRole.type:
                return new ModeratorRole();
            case ClientRole.type:
                return new ClientRole();
        }
    }
}

module.exports = {
    RoleFactory: RoleFactory,
    AdminRole: AdminRole
}