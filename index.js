var express = require('express');

//Importacion de modelos y controlador
const UserSchema = require('./models/users.model');
const CenterSchema = require('./models/centers.model');
const ValorationSchema = require('./models/valoracion.model');
const Controlador = require('./controllers/controlador');

var app = express();
var bodyParser = require('body-parser');
var methodOverride = require("method-override");
var mongoose = require('mongoose');

var cors = require('cors');

//Añadido para hacer el login
var middleware = require('./middleware');

//Configuracion
app.use(cors());

//Conexion con la base de datos
mongoose.connect('mongodb://localhost/bdTFG', function (err, res) {
    if (err) throw err;
    console.log('Conectado a la base de datos.');
});

//Middlewares
app.use(bodyParser.urlencoded({ extended: true })); //La he cambiado a true para el login
app.use(bodyParser.json());
app.use(methodOverride());

//Rutas API
var ruta = express.Router();

//Rutas publicas
ruta.get('/backend', function (req, res) {
    Controlador.comprobarConexion(req, res);
});
ruta.post('/createUser', function (req, res) {
    Controlador.createUser(req, res);
});
ruta.post('/login', function (req, res) {
    Controlador.loginUser(req, res);
});

// Rutas privadas
ruta.post('/obtenerPista', middleware.ensureAuthenticated, function (req, res) {
    Controlador.obtenerPista(req, res);
});
//Revisar si sirve sino a tomar por culo 
ruta.get('/mostrarPista', middleware.ensureAuthenticated, function (req, res) {
    Controlador.mostrarPista(req, res);
});
ruta.put('/editUser', middleware.ensureAuthenticated, function (req, res) {
    Controlador.updateUser(req, res);
});
ruta.delete('/deleteUser', middleware.ensureAuthenticated, function (req, res) {
    Controlador.deleteUser(req, res);
});
ruta.get('/logout', middleware.ensureAuthenticated, function (req, res) {
    Controlador.logoutUser(req, res);
});
ruta.post('/findUser', middleware.ensureAuthenticated, function (req, res) {
    Controlador.findUser(req, res);
});
ruta.post('/enviarValoracion', middleware.ensureAuthenticated, function (req, res) {
    Controlador.enviarValoracion(req, res);
});
ruta.get('/mostrarValoraciones', middleware.ensureAuthenticated, function (req, res) {
    Controlador.enviarValoracion(req, res);
});

app.use('/api', ruta);

//Iniciar sevidor
app.listen(3000, function () {
    console.log('Servidor Back en http://localhost:3000');
});