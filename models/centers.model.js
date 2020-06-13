const mongoose = require("mongoose");

const CenterSchema = new mongoose.Schema({
    nombre: {type: String, required: true, trim: true},
    ciudad: {type: String, required: true, trim: true},
    contacto: {type: String, required: true, unique: true, match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'], trim: true},
    url: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}
}, {versionKey: false});

module.exports = mongoose.model("Center", CenterSchema);