var UserSchema = require("../models/users.model");
var ValoracionSchema = require("../models/valoracion.model");
var PaisSchema = require("../models/pais.model");
var CiudadesSchema = require("../models/ciudad.model");
var CentrosSchema = require("../models/centers.model");
var service = require("../security/service");
var async = require("async");
var md5 = require("md5");
// Añadido para obtener pista
const cheerio = require("cheerio");
const request = require("request");
// Crear usuario (REGISTRAR/SIGNUP) - POST
exports.createUser = function (req, res, err) {
    var nombre;
    var apellidos;
    var email;
    var password;
    var confirmarPassword;
    var permiso;
    var passwordCifher;
    nombre = req.body.nombre;
    apellidos = req.body.apellidos;
    email = req.body.email;
    password = req.body.password;
    confirmarPassword = req.body.confirmarPassword;
    permiso = req.body.permiso;
    //  Validación de campos
    if (nombre === undefined || nombre === "" || nombre === null) {
        return res.send(400, "El campo Nombre está vacío, revisar");
    } else if (apellidos === undefined || apellidos === "" || apellidos === null) {
        return res.send(400, "El campo Apellidos está vacío, revisar");
    } else if (email === undefined || email === "" || email === null) {
        return res.send(400, "El campo Email está vacío, revisar");
    } else if (password === undefined || password === "" || password === null) {
        return res.send(400, "El campo Password está vacío, revisar");
    } else if (password !== confirmarPassword) {
        return res.send(400, "La confirmación de contraseña no coinciden, revisar");
    } else if (permiso !== true) {
        return res.send(400, "Debe aceptar el permiso para registrarse, revisar");
    }

    passwordCifher = md5(password);
    // Creamos el usuario y lo guardamos
    var user = new UserSchema({
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        password: passwordCifher,
        permiso: permiso
    });
    user.save(function (err) {
        if (err) {
            return res.send(500, err.message);
        }
        res.status(200).json(user);
    });
};
// Actualizar usuario (EDITAR) - PUT
exports.updateUser = function (req, res) {
    // falta devolver el objeto actuallizado
    // findOneAndUpdate devuelve el que encuentra no el actualizado
    var queries = [];
    queries.push(function (callbackW) {
        UserSchema.findOneAndUpdate({_id: req.params.id}, req.body, function (err, user) {
            if (err) {
                return callbackW(err);
            }

            return callbackW(null, user);
        });
    });
    async.waterfall(queries, function (err, user) {
        if (err) {
            res.send(500, err.message);
        }

        res.status(200).json(user);
    });
};
// Eliminar usuario (ELIMINAR) - DELETE
exports.deleteUser = function (req, res) {
    // hacerlo con una intruccion
    var queries = [];
    queries.push(function (callbackW) {
        UserSchema.findById(req.params.id, function (err, user) {
            if (err) {
                return callbackW(err);
            }

            return callbackW(null, user);
        });
    });
    queries.push(function (user, callbackW) {
        user.remove(function (err) {
            if (err) {
                return callbackW(err);
            }

            return callbackW(null, user);
        });
    });
    async.waterfall(queries, function (err, user) {
        if (err) {
            return res.send(500, err.message);
        }

        return res.status(200).json(user);
    });
};
// Iniciar sesion (LOGIN
exports.loginUser = async function (req, res) {
    var email;
    var password;
    email = req.body.email;
    password = md5(req.body.password);
    UserSchema.findOne({email: email, password: password}, function (err, usuario) {
        if (err || usuario === null) {
            return res.send(400, {err: "El usuario o la contraseña no es correcto"});
        }

        var token = service.createToken(usuario);
        return res.status(200).send({user: usuario, token: token}).json();
    });
};
// Buscar usuario por email (findUser) - GET
exports.findUser = function (req, res) {
    var emailElegido;
    emailElegido = req.body.email;
    console.log(emailElegido);
    UserSchema.findOne({email: emailElegido}, function (err, user) {
        if (err) {
            res.send(500, err.message);
        } else {
            res.status(200).json(user);
        }
    });
};
// Recuperar contraseña usuario por email (recuperarPass) - GET
exports.recuperarPassword = function (req, res) {
    var emailElegido = req.body.email;
    UserSchema.findOne({email: emailElegido}, function (err, user) {
        if (err) {
            return res.send(500, err.message);
        }

        return res.status(200).json({password: user.password});
    });
};
// Cerrar sesion (LOGOUT) - GET
exports.logoutUser = function (req, res, next) {
    return res.status(200).json({});
};
// Probando funcion thereads
exports.obtenerPista = function (req, resp, next) {
    var fechaElegidaString, inicioHoraString, finHoraString;
    var anyoMesDiaElegidoArray, anyoElegido, mesElegido, diaElegido;
    var horaMinInicioHoraElegidoArray, horaInicioElegido, minInicioElegido;
    var horaMinFinHoraElegidoArray, horaFinElegido, minFinElegido;
    var inicioElegidoDate, finElegidoDate;
    var ubicacionElegida;
    let uris;
    let counter = 1;
    var partidas = {};
    var reUrl = [];
    var queries = [];
    fechaElegidaString = req.body.fecha;
    inicioHoraString = req.body.inicioHora;
    finHoraString = req.body.finHora;
    ubicacionElegida = req.body.ubicacion;
    switch (ubicacionElegida) {
        case "valencia":
            console.log("Funciona valencia");
            uris = [
                "http://usuarios.futbolcity.es/partidas/Cuadro.aspx" + "?f=" + fechaElegidaString + "&c=3",
//       "http://www.padel365.com/Partidas/Cuadro.aspx" + "?f=" + fechaElegidaString + "&c=3", // no tiene
//       "https://www.sumapadelalfafar.com/Partidas/Cuadro.aspx" + "?f=" + fechaElegidaString + "&c=3" // 0 todas no disponible
            ];
            break;
        case "castellon":
            console.log("Funciona castellon");
            uris = [
                "http://www.okpadel.es/Partidas/Cuadro.aspx" + "?f=" + fechaElegidaString + "&c=3"
            ];
            break;
        case "alicante":
            console.log("Funciona alicante");
            break;
        case "madrid":
            console.log("Funciona madrid");
            break;
        case "barcelona":
            console.log("Funciona barcelona");
            break;
        case "sevilla":
            console.log("Funciona sevilla");
            break;
        default:
            console.log("No hay uris disponibles");
            break;
    }

    anyoMesDiaElegidoArray = fechaElegidaString.split("-");
    anyoElegido = anyoMesDiaElegidoArray[0];
    mesElegido = anyoMesDiaElegidoArray[1];
    diaElegido = anyoMesDiaElegidoArray[2];
    horaMinInicioHoraElegidoArray = inicioHoraString.split(":");
    horaInicioElegido = horaMinInicioHoraElegidoArray[0];
    minInicioElegido = horaMinInicioHoraElegidoArray[1];
    horaMinFinHoraElegidoArray = finHoraString.split(":");
    horaFinElegido = horaMinFinHoraElegidoArray[0];
    minFinElegido = horaMinFinHoraElegidoArray[1];
    if (horaFinElegido === "00") {
        horaFinElegido = "24";
    }

    inicioElegidoDate = new Date(anyoElegido, mesElegido - 1, diaElegido, parseInt(horaInicioElegido) + 1, minInicioElegido);
    finElegidoDate = new Date(anyoElegido, mesElegido - 1, diaElegido, parseInt(horaFinElegido) + 1, minFinElegido);
    queries.push(function (callbackW) {
        var bodies;
        bodies = [];
        async.eachOfSeries(uris, function (uri, key, callbackEach) {
            request(uri, (err, res, body) => {
                if (err) {
                    return callbackEach(err);
                }
                if (!err && res.statusCode === 200) {
                    bodies.push(body);
                }
                return callbackEach();
            }); // fin request
        }, function (err) {
            if (err) {
                return callbackW();
            }

            return callbackW(null, bodies);
        });
    });
    queries.push(function (bodies, callbackW) {
        for (var i in bodies) {
            let horasHtml, horasMinInicioHorasMinFinPartidaHtmlArray, inicioPartidaDate, finPartidaDate, disponibilidad;
            let horaInicioPartidaHtml, minInicioPartidaHtml, horaFinPartidaHtml, minFinPartidaHtml;
            let parametros, parametrosHoraInicio, parametrosHoraFin, horasMinInicioPartidaHtmlArray, horasMinFinPartidaHtmlArray;
            var info;
            var html = cheerio.load(bodies[i]);
            console.log("Data retrived correctly from: " + uris[counter - 1]);
            // Extracion de la informacion de la web.
//            info = html(".TextoLink,.botonVerdePartidas", "#divContenedorPartidas");
            info = html(".botonVerdePartidas", "#divContenedorPartidas");
            // probar con 2 y luego cambiar por info.length
//            for (let j = 0; j < (info.length); j += 2) {
            for (let j = 0; j < (info.length); j++) {
                let result = {};

                // Extraccion de las horas ANTIGUO
//                horasHtml = html(info[j]).text().replace(" - ", ":");
//                horasMinInicioHorasMinFinPartidaHtmlArray = horasHtml.split(":");
//                horaInicioPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[0];
//                minInicioPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[1];
//                horaFinPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[2];
//                minFinPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[3];

                // Extraccion de las horas NUEVO 
                reUrl = info[j].attribs.href;
                if (reUrl !== undefined) {
                    parametros = reUrl.split("?")[1];
                    parametrosHoraInicio = parametros.split("&")[4];
                    parametrosHoraFin = parametros.split("&")[5];
                    horasMinInicioPartidaHtmlArray = parametrosHoraInicio.split("=")[1];
                    horaInicioPartidaHtml = horasMinInicioPartidaHtmlArray.split(":")[0];
                    minInicioPartidaHtml = horasMinInicioPartidaHtmlArray.split(":")[1];
                    horasMinFinPartidaHtmlArray = parametrosHoraFin.split("=")[1];
                    horaFinPartidaHtml = horasMinFinPartidaHtmlArray.split(":")[0];
                    minFinPartidaHtml = horasMinFinPartidaHtmlArray.split(":")[1];

                    inicioPartidaDate = new Date(anyoElegido, mesElegido - 1, diaElegido, parseInt(horaInicioPartidaHtml) + 1, parseInt(minInicioPartidaHtml));
                    if (horaFinPartidaHtml === "0") {
                        horaFinPartidaHtml = "24";
                    }
                    finPartidaDate = new Date(anyoElegido, mesElegido - 1, diaElegido, parseInt(horaFinPartidaHtml) + 1, parseInt(minFinPartidaHtml));
//                    disponibilidad = html(info[j + 1]).text();
                    disponibilidad = html(info[j]).text();
                    // habbria que meterlo en if de las horas
                    result = {
                        // "url": uris[counter],
                        "pista": reUrl.split("/")[2],
//                    "pista": "a",
                        "date": html(".fechaTabla", "#divContenedorPartidas").attr("value"),
                        "horainicioPartida": horaInicioPartidaHtml + ":" + minInicioPartidaHtml,
                        "horafinPartida": horaFinPartidaHtml + ":" + minFinPartidaHtml,
                        // "inicioElegido": inicioElegido,
                        // "finElegido": finElegido,
                        "direccion": reUrl,
                        "disponibilidad": disponibilidad
                    };
                    if (j === 0) {
                        partidas["web_" + counter] = [];
                    }

                    if (inicioPartidaDate >= inicioElegidoDate && finPartidaDate <= finElegidoDate &&
                            disponibilidad === "Apuntarse") {
                        partidas["web_" + counter].push(result);
                    }
                } // fin if undefined
            } // fin for j
            counter++;
        } // fin for
        return callbackW();
    });
    async.waterfall(queries, function (err) {
        if (err) {
            return next();
        }

        resp.json(partidas);
    });
}; // fin obtener pista

// Enviar valoracion (VALORAR) - POST
exports.enviarValoracion = function (req, res, err) {
    var usuario = req.body.usuario;
    var puntuacion = req.body.puntuacion;
    var comentario = req.body.comentario;
    var valoradorPor = req.body.valorado_por;
    var valoracion = new ValoracionSchema({
        puntuacion: puntuacion,
        comentario: comentario,
        usuario: usuario,
        valorado_por: valoradorPor
    });
    valoracion.save(function (err) {
        if (err) {
            return res.send(500, err.message);
        }
        res.status(200).json(valoracion);
    });
};
// Mostrar valoraciones (VALORAR) - GET
exports.mostrarValoraciones = function (req, res) {
    var id = req.params.id;
    ValoracionSchema.find({usuario: id}, function (err, valoraciones) {
        if (err) {
            res.send(500, err.message);
        } else {
            res.status(200).json(valoraciones);
        }
    });
};

exports.mostrarPaises = function (req, res) {
    PaisSchema.find({}, function (err, paises) {
        if (err) {
            res.send(500, err.message);
        } else {
            res.status(200).json(paises);
        }
    });
};

exports.enviarPais = function (req, res, err) {
    var nombre = req.body.nombre;
    var pais = new PaisSchema({
        nombre: nombre
    });
    pais.save(function (err) {
        if (err) {
            return res.send(500, err.message);
        }
        res.status(200).json(pais);
    });
};

exports.mostrarCiudades = function (req, res) {
    CiudadesSchema.find({}, function (err, ciudades) {
        if (err) {
            res.send(500, err.message);
        } else {
            res.status(200).json(ciudades);
        }
    });
};

exports.enviarCiudad = function (req, res, err) {
    var nombre = req.body.nombre;
    var pais = req.body.pais;
    var ciudad = new CiudadesSchema({
        nombre: nombre,
        pais: pais
    });
    ciudad.save(function (err) {
        if (err) {
            return res.send(500, err.message);
        }
        res.status(200).json(ciudad);
    });
};

exports.mostrarCentros = function (req, res) {
    CentrosSchema.find({}, function (err, ciudades) {
        if (err) {
            res.send(500, err.message);
        } else {
            res.status(200).json(ciudades);
        }
    });
};

exports.enviarCentro = function (req, res, err) {
    var nombre = req.body.nombre;
    var ciudad = req.body.ciudad;
    var contacto = req.body.contacto;
    var url = req.body.url;
    var centro = new CentrosSchema({
        nombre: nombre,
        ciudad: ciudad,
        contacto: contacto,
        url: url
    });
    centro.save(function (err) {
        if (err) {
            return res.send(500, err.message);
        }
        res.status(200).json(centro);
    });
};
