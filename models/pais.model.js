const mongoose = require("mongoose");

const PaisSchema = new mongoose.Schema({
    pais: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}
}, {versionKey: false});

module.exports = mongoose.model("Pais", PaisSchema);