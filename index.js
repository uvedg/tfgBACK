var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var mongoose = require("mongoose");
var routes = require("./routes/routes");
var cors = require("cors");

// Configuracion
app.use(cors());

mongoose.set('useFindAndModify', false);

//Conexion con la base de datos
mongoose.connect("mongodb://localhost/bdTFG", {useCreateIndex: true, useNewUrlParser: true}, function (err, res) {
    if (err) {
        throw err;
    }
    console.log("Conectado a la base de datos.");
});

// Middlewares
app.use(bodyParser.urlencoded({extended: true})); // La he cambiado a true para el login
app.use(bodyParser.json());
app.use(methodOverride());

// Rutas
app.use("/api", routes);

// Iniciar sevidor
app.listen(3000, function () {
    console.log("Servidor Back en http://localhost:3000");
});
