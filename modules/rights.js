/**
 * @typedef Rights
 * @type {Object}
 * @property {Symbol} viewUsers Dreptul de a vizualiza utilizatori
 * @property {Symbol} deleteUsers Dreptul de a sterge utilizatori
 * @property {Symbol} buyProducts Dreptul de a cumpara produse
 * @property {Symbol} viewGraphs Dreptul de a vizualiza statisticile site-ului
 * @property {Symbol} addProducts Dreptul de a adauga produse noi
 * @property {Symbol} deleProducts Dreptul de a sterge produse de pe site
 * @property {Symbol} modifyProducts Dreptul de a modifica informatii despre produse
 */

const Rights = {
    viewUsers: Symbol("viewUsers"),
    deleteUsers: Symbol("deleteUsers"),
    buyProducts: Symbol("buyProducts"),
    viewGraphs: Symbol("viewGraphs"),
    addProducts: Symbol("addProducts"),
    deleteProducts: Symbol("deleteProducts"),
    modifyProducts: Symbol("modifyProducts")
}

module.exports = Rights;