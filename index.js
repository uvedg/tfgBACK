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
mongoose.connect('mongodb://localhost/bdTFG', function(err, res) {
    if(err) throw err;
    console.log('Conectado a la base de datos.');
});

//Middlewares
app.use(bodyParser.urlencoded({ extended: true })); //La he cambiado a true para el login
app.use(bodyParser.json());
app.use(methodOverride()); 

//Rutas API
var ruta = express.Router();

ruta.route('/backend').get(Controlador.comprobarConexion);
ruta.route('/createUser').post(Controlador.createUser);
ruta.route('/login').post(Controlador.loginUser);
//Hacer privadas, solo acceder si estas logeado
ruta.route('/editUser').put(Controlador.updateUser);
ruta.route('/deleteUser').delete(Controlador.deleteUser); 
ruta.route('/logout').get(Controlador.logoutUser);
ruta.route('/obtenerPista').post(Controlador.obtenerPista);
ruta.route('/findUser').post(Controlador.findUser);
ruta.route('/enviarValoracion').post(Controlador.enviarValoracion);
ruta.route('/mostrarValoraciones').get(Controlador.mostrarValoraciones);


//Ruta solo accesible si estas autenticado
ruta.get('/private', middleware.ensureAuthenticated, function(req, res) {
    
});

app.use('/api', ruta);

//Iniciar sevidor
app.listen(3000, function() {
    console.log('Servidor Back en http://localhost:3000');
});