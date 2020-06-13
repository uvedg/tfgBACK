const mongoose = require("mongoose");

const CiudadSchema = new mongoose.Schema({
    ciudad: {type: String, required: true, trim: true},
    pais: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}
}, {versionKey: false});

module.exports = mongoose.model("Ciudad", CiudadSchema);