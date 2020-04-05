const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    nombre: {type: String, required: true, trim: true},
    apellidos: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true, match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'], trim: true},
    // Poner hashedPassword para mayor seguridad
    password: {type: String, required: true, trim: true},
    permiso: {type: Boolean, required: true},
    createdAt: {type: Date, default: Date.now},
    // token: { type: String, required: true},
    roles: [{type: String}]
}, {versionKey: false});

module.exports = mongoose.model('User', UserSchema);