var express = require("express");
const Controlador = require("../controllers/controlador");
var middleware = require("../security/middleware");

// Rutas API
var router = express.Router();

router.post("/login", function (req, res) {
    Controlador.loginUser(req, res);
});
router.post("/createUser", function (req, res) {
    Controlador.createUser(req, res);
});
router.put("/updateUser/:id", middleware.ensureAuthenticated, function (req, res) {
    Controlador.updateUser(req, res);
});
router.delete("/deleteUser/:id", middleware.ensureAuthenticated, function (req, res) {
    Controlador.deleteUser(req, res);
});
router.post("/recuperarPassword", function (req, res) {
    Controlador.recuperarPassword(req, res);
});
router.get("/logout", middleware.ensureAuthenticated, function (req, res) {
    Controlador.logoutUser(req, res);
});
router.post("/obtenerPista", middleware.ensureAuthenticated, function (req, res) {
    Controlador.obtenerPista(req, res);
});
router.post("/findUser", middleware.ensureAuthenticated, function (req, res) {
    Controlador.findUser(req, res);
});

router.post("/enviarValoracion", middleware.ensureAuthenticated, function (req, res) {
    Controlador.enviarValoracion(req, res);
});
router.get("/mostrarValoraciones/:id", middleware.ensureAuthenticated, function (req, res) {
    Controlador.mostrarValoraciones(req, res);
});
router.get("/pais", middleware.ensureAuthenticated, function (req, res) {
    Controlador.mostrarPaises(req, res);
});
router.post("/pais", middleware.ensureAuthenticated, function (req, res) {
    Controlador.enviarPais(req, res);
});
router.get("/ciudad", middleware.ensureAuthenticated, function (req, res) {
    Controlador.mostrarCiudades(req, res);
});
router.post("/ciudad", middleware.ensureAuthenticated, function (req, res) {
    Controlador.enviarCiudad(req, res);
});
router.get("/centro", middleware.ensureAuthenticated, function (req, res) {
    Controlador.mostrarCentros(req, res);
});
router.post("/centro", middleware.ensureAuthenticated, function (req, res) {
    Controlador.enviarCentro(req, res);
});

module.exports = router;
