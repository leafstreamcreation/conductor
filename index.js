const mongoose = require("mongoose");
const RegeneratingDocument = require("./RegeneratingDocument/RegeneratingDocument");

//connect to server
require("./db");

//TODO: load application state, build queues, gather and attempt creating overdue documents
console.log("ping");
const test = new RegeneratingDocument({ duck: "quack" }, 2000, (document) => {
    console.log(document.duck);
}, Date.now() + 1000);
