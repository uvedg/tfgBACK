const mongoose = require("mongoose");
// var Schema = mongoose.Schema;

const ValoracionSchema = new mongoose.Schema({
    // Falta saber si las id de los usuarios (el que hace la valoracion y el valorado) se pone aqui.
    user: {type: String, required: true, trim: true},
    comentario: {type: String, required: false, trim: true},
    puntuacion: {type: Number, required: true, trim: true},
    valorado_por: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}
//        user: {type: Schema.Types.ObjectId, ref: "User", required: true, trim: true},
}, {versionKey: false});

module.exports = mongoose.model("Valoracion", ValoracionSchema);