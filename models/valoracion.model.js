const mongoose = require("mongoose");

const ValoracionSchema = new mongoose.Schema({
    // Falta saber si las id de los usuarios (el que hace la valoracion y el valorado) se pone aqui.
    puntuacion: {type: Number, required: true, trim: true},
    comentario: {type: String, required: false, trim: true},
    id_emisor: {type: String, required: true, trim: true},
    id_receptor: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}
}, {versionKey: false});

module.exports = mongoose.model('Valoracion', ValoracionSchema);