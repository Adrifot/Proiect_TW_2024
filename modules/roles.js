const { Client } = require("pg");
const Rights = require("./rights.js");

/**
 * Represents a generic role.
 */
class Role {
    /**
     * Gets the type of the role.
     * @returns {string} The type of the role.
     */
    static get type() { return "generic"; }

    /**
     * Gets the rights associated with the role.
     * @returns {Array} The rights associated with the role.
     */
    static get rights() { return []; }

    /**
     * Constructs a new Role instance.
     */
    constructor() {
        this.code = this.constructor.type;
    }

    /**
     * Checks if the role has a specific right.
     * @param {string} right - The right to check.
     * @returns {boolean} True if the role has the right, false otherwise.
     */
    hasRight(right) {
        return this.constructor.rights.includes(right);
    }
}

/**
 * Represents an admin role.
 * @extends Role
 */
class AdminRole extends Role {
    /**
     * Gets the type of the admin role.
     * @returns {string} The type of the admin role.
     */
    static get type() { return "admin"; }

    /**
     * Constructs a new AdminRole instance.
     */
    constructor() { super(); }

    /**
     * Checks if the admin role has a specific right.
     * @returns {boolean} Always true for admin role.
     */
    hasRight() { return true; }
}

/**
 * Represents a moderator role.
 * @extends Role
 */
class ModeratorRole extends Role {
    /**
     * Gets the type of the moderator role.
     * @returns {string} The type of the moderator role.
     */
    static get type() { return "moderator"; }

    /**
     * Gets the rights associated with the moderator role.
     * @returns {Array<string>} The rights associated with the moderator role.
     */
    static get rights() {
        return [
            Rights.viewUsers,
            Rights.deleteUsers,
            Rights.deleteProducts,
            Rights.modifyProducts
        ];
    }

    /**
     * Constructs a new ModeratorRole instance.
     */
    constructor() { super(); }
}

/**
 * Represents a client role.
 * @extends Role
 */
class ClientRole extends Role {
    /**
     * Gets the type of the client role.
     * @returns {string} The type of the client role.
     */
    static get type() { return "common"; }

    /**
     * Gets the rights associated with the client role.
     * @returns {Array<string>} The rights associated with the client role.
     */
    static get rights() {
        return [Rights.buyProducts];
    }

    /**
     * Constructs a new ClientRole instance.
     */
    constructor() { super(); }
}

/**
 * A factory for creating role instances.
 */
class RoleFactory {
    /**
     * Creates a role instance based on the specified type.
     * @param {string} type - The type of the role to create.
     * @returns {Role} The created role instance.
     */
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
};
