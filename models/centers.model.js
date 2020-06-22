const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const CenterSchema = new mongoose.Schema({
    nombre: {type: String, required: true, trim: true},
//    ciudad: {type: String, required: true, trim: true},
    ciudad: {type: Schema.Types.ObjectId, ref: "Pais", required: true, trim: true},
    contacto: {type: String, required: true, trim: true},
    url: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}
}, {versionKey: false});

module.exports = mongoose.model("Center", CenterSchema);