var UserSchema = require("../models/users.model");
var ValoracionSchema = require("../models/valoracion.model");
var service = require("../security/service");
var async = require("async");
var md5 = require("md5");

// Añadido para obtener pista
const cheerio = require("cheerio");
const request = require("request");

// Comprueba  la conexcion Front con Back - GET
exports.comprobarConexion = function (req, res) {
    res.json({msg: "Frontend y Backend conectados."});
    console.log("Frontend y Backend conectados por consola.");
};

// Crear usuario (REGISTRAR/SIGNUP) - POST
exports.createUser = function (req, res, err) {
    console.log("Estoy en crear usuarios por consola.");

    // Traemos los datos del formulario
    var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var email = req.body.email;
    var password = req.body.password;
    var confirmarPassword = req.body.confirmarPassword;
    var permiso = req.body.permiso;
    var passwordCifher = md5(password);

    // Validación de campos
    if (nombre === "") {
        console.log("Error: Campo 'nombre' vacio.");
        return res.send("El campo Nombre está vacío, revisar");
    } else if (apellidos === "") {
        console.log("Error: Campo 'apellidos' vacio.");
        return res.send("El campo Apellidos está vacío, revisar");
    } else if (email === "") {
        console.log("Error: Campo 'email' vacio.");
        return res.send("El campo Email está vacío, revisar");
    } else if (password === "" || password === null) {
        console.log("Error: Campo 'password' vacio.");
        return res.send("El campo Password está vacío, revisar");
    } else if (password !== confirmarPassword) {
        console.log("Error: La confirmación de contraseña no coinciden.");
        return res.send("La confirmación de contraseña no coinciden, revisar");
    } else if (permiso !== true) {
        console.log("Error: Debe aceptar el permiso para registrarse.");
        return res.send("Debe aceptar el permiso para registrarse, revisar");
    }

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
    console.log("Estoy en actualizar usuarios por consola.");

    var queries = [];
    var nombre;
    var apellidos;
    var email;
    var password;
    var permiso;

    nombre = req.body.nombre;
    apellidos = req.body.apellidos;
    email = req.body.email;
    password = req.body.password;
    permiso = req.body.permiso;

    queries.push(function (callbackW) {
        UserSchema.findById(req.params.id, function (err, user) {
            if (err) {
                return callbackW(err);
            }
            user.nombre = nombre;
            user.apellidos = apellidos;
            user.email = email;
            user.password = password;
            user.permiso = permiso;

            return callbackW(null, user);
        });
    });

    queries.push(function (user, callbackW) {
        user.save(function (err) {
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
    console.log("Se muestra el req body: ");
    console.log(req.body);

    var email;
    var password;
    let usuarioEncontrado;

    email = req.body.email;
    password = md5(req.body.password);

    await UserSchema.findOne({email: email, password: password}, function (err, usuario) {
        if (err) {
            return console.log("Error al buscar usuario en el login");
        }

        usuarioEncontrado = usuario;
    });

    if (!usuarioEncontrado) {
        res.send(400, {err: "El usuario o la contraseña no es correcto"});
    } else {
        var token = service.createToken(usuarioEncontrado);
        res.status(200).send({user: usuarioEncontrado, token: token}).json();
    }
};

// Buscar usuario por email (findUser) - GET
exports.findUser = function (req, res) {
    var emailElegido;

    emailElegido = req.body.email;
    console.log(emailElegido);

    UserSchema.find({email: emailElegido}, function (err, user) {
        if (err) {
            res.send(500, err.message);
        } else {
            console.log(user.permiso);
            console.log(user.email);
            console.log(user);
            res.json(user);
            // if(user.permiso == true && user.email == email_elegido){
            //     res.json(user);
            //     console.log(user);
            // } else {
            //     res.json({ msg: "Error al buscar usuario."});
            // }

            // console.log("usuario encontrado");
            // console.log(user);
            // res.status(200).json(user);
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
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect("http://localhost:3000/api");
            }
        });
    }
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
                "http://usuarios.futbolcity.es/partidas/Cuadro.aspx" + "?f=" + fechaElegidaString + "&c=3"
                        // "http://www.padel365.com/Partidas/Cuadro.aspx" + "?f=" + fechaElegida + "&c=3"
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
            });// fin request
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
            var info;
            var html = cheerio.load(bodies[i]);

            console.log("Data retrived correctly from: " + uris[counter - 1]);

            // Extracion de la informacion de la web.
            info = html(".TextoLink,.botonVerdePartidas", "#divContenedorPartidas");

            // probar con 2 y luego cambiar por info.length
            for (let j = 0; j < (info.length); j += 2) {
                let result = {};

                // Extraccion de las horas
                horasHtml = html(info[j]).text().replace(" - ", ":");
                horasMinInicioHorasMinFinPartidaHtmlArray = horasHtml.split(":");
                horaInicioPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[0];
                minInicioPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[1];
                horaFinPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[2];
                minFinPartidaHtml = horasMinInicioHorasMinFinPartidaHtmlArray[3];

                inicioPartidaDate = new Date(anyoElegido, mesElegido - 1, diaElegido, parseInt(horaInicioPartidaHtml) + 1, parseInt(minInicioPartidaHtml));
                if (horaFinPartidaHtml === "0") {
                    horaFinPartidaHtml = "24";
                }
                finPartidaDate = new Date(anyoElegido, mesElegido - 1, diaElegido, parseInt(horaFinPartidaHtml) + 1, parseInt(minFinPartidaHtml));

                disponibilidad = html(info[j + 1]).text();

                reUrl = info[j].attribs.href;
                // habbria que meterlo en if de las horas
                result = {
                    // "url": uris[counter],
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
};// fin obtener pista

// Enviar valoracion (VALORAR) - POST
exports.enviarValoracion = function (req, res, err) {
    console.log("Estoy en enviar valoracion por consola.");

    // Extraccion de id
    var idEmisor = req.body.id;
    console.log(idEmisor);
    let idReceptor;
    var emailElegido = req.body.email;
    // Traemos los datos del formulario
    var puntuacion = req.body.puntuacion;
    var descripcion = req.body.descripcion;

    UserSchema.find({email: emailElegido}, function (err, user) {
        if (err) {
            res.send(500, err.message);
        } else {
            console.log(user._id);
            idReceptor = user._id;
        }
    });

    // Creamos la valoracion y lo guardamos
    var valoracion = new ValoracionSchema({
        puntuacion: puntuacion,
        descripcion: descripcion,
        id_emisor: idEmisor,
        id_receptor: idReceptor
    });

    // Poner la id_emisor e id_receptor
    valoracion.save();
};

// Mostrar valoraciones (VALORAR) - GET
exports.mostrarValoraciones = function (req, res) {
    console.log("Estoy en mostrar valoraciones por consola.");

    // Sustituir por la id del usuario buscado previamente.
    var idBuscado = "b";

    ValoracionSchema.find({id_receptor: idBuscado}, function (err, valoraciones) {
        if (err) {
            res.send(500, err.message);
        } else {
            console.log("Se muestras todas las valoraciones");
            console.log(valoraciones);
            res.status(200).json(valoraciones);
        }
    });
};

// counter++;

// if (counter == urisLenght) {
// console.log(result); resp.json(result);
// for(let k =0; k < partidas.length; k++){
// console.log(partidas[k]);
// resp.json(partidas);
// }
// });
// };

// probando
// de internet para enilet al html
// app.get("/", function (req, res) {
//     res.render("index", { title: "Hey", message: "Hello there!"});
// });

// Obtener pistas (SCRAPING) - GET
// exports.obtenerPista = function (req, resp) {
//     //let final_2 = new Array();
//     let array = {
//         "partidas": [

//         ]
//     };
// console.log("Estoy en obtener pista por consola.");
//     // Traemos los datos del formulario
//     let ubicacion_elegida = req.body.ubicacion;
//     let fechaElegida = req.body.fecha;
//     let inicioHora_elegida = req.body.inicioHora;
//     let finHora_elegida = req.body.finHora;

//     inicioHora_elegida = inicioHora_elegida.toString();
//     finHora_elegida = finHora_elegida.toString();

//     //Convertir hora para realizar correctamente la validación siguiente
//     if(finHora_elegida == "00:00"){
//         finHora_elegida = "24:00";
//     }

//     console.log("La ubicacion es: "+ubicacion_elegida);
//     console.log("La fecha es: "+fechaElegida);
//     console.log("La hora inicio es: "+inicioHora_elegida);
//     console.log("La hora fin es: "+finHora_elegida);

//     // Validación de campos
//     if (inicioHora_elegida >= finHora_elegida) {
//         console.log("Error: La hora de fin no puede ser menor a la hora de inicio.");
//         return resp.send("La hora de fin es menor que la hora de inicio");
//     }

//     //Variable con la información de la página web.
//     let info;
//     //Variables para el manejo de las horas.
//     let horas, inicioHora, finHora;
//     //Variable para el manejo de las direcciones web.
//     let urls;
//     //Variable para el manejo de la fecha.
//     let fecha;
//     //Variable y vector para el manejo del estado (Apuntarse/No disponible/Completa)
//     let estado;
//     let v_estado = [];
//     //Objeto con la información de los resultados
//     let resultado;
//     //Vector de direcciones url donde se realiza scraping
//     let v_url =
//     //         "http://usuarios.futbolcity.es/partidas/Cuadro.aspx"+"?f="+fechaElegida+"&c=3";
//         //"http://www.padel365.com/Partidas/Cuadro.aspx"+"?f="+fechaElegida+"&c=3"];

//     let cont;
//     let contador_total= 0;

//     //for(cont = 0; cont<v_url.length; cont++) {
//         //contador_total++;
//         request(v_url, (err, res, body) => {
//             //contador_total++;
//             if(!err && res.statusCode == 200) {
//                 let $ = cheerio.load(body);

//                 //Extracion de la informacion de la web.
//                 info = $(".TextoLink", "#divContenedorPartidas");

//                 //Extraccion de la fecha
//                 fecha = $(".fechaTabla", "#divContenedorPartidas").attr("value");

//                 //Extraccion del estado de la pista (tambien hay botones Amarillo, etc...)
//                 $(".botonVerdePartidas,.botonAmarilloPartidas,.botonAzulPartidas", "#divContenedorPartidas").each(function () {
//                     estado = $(this).text();
//                     v_estado.push(estado);
//                 });

//                 for(let i=0; i < info.length; i++){

//                     //Extraccion de las horas
//                     horas = $(info[i]).text().split(" - ");
//                     //Separacion entre las horas de inicio y las horas de fin
//                     for(let k=0; k < horas.length; k++){
//                         inicioHora = horas[0];
//                         finHora = horas[1];
//                         //inicioHora = inicioHora.toString();
//                         //finHora = finHora.toString();
//                     }

//                     //Extraccion de las direcciones url
//                     urls = info[i].attribs.href;

//                     //Solo muestra las disponibles para apuntarse/reserlet dentro del horario (falta la ubicacion)
//                     if(v_estado[i] == "Apuntarse" || v_estado[i] == "RESERVAR"){
//                         if(inicioHora >= inicioHora_elegida && finHora <= finHora_elegida){
//                             resultado = {"partida": i, "fecha": fecha, "estado": v_estado[i], "inicioHora": inicioHora, "finHora": finHora, "url": urls };
//                             array["partidas"].push(resultado);
//                             //console.log(resultado);

//                             //Creamos el la pista y la guardamos
//                             // let pista_padel = new PistaSchema({
//                             //     partida: i,
//                             //     //poner unicamente Valencia ahora
//                             //     ubicacion: ubicacion,
//                             //     fecha: fecha,
//                             //     estado: v_estado[i],
//                             //     inicioHora: inicioHora,
//                             //     finHora: finHora,
//                             //     url: urls
//                             // })
//                             // pista_padel.save();

//                             //final_2.push(resultado);
//                             //resp.json(array);
//                             console.log(array);
//                             //resp.json({ msg: "Frontend y Backend conectados."});
//                             //primero conseguir mostrar el mensaje, luego un resultado, y luego ya el array json

//                             //Aqui el vector se muestra con los datos correctamente
//                             //console.log(final);

//                         }
//                     }
//                 }

//             }

//         });
//         //Aqui se muestra vacio (se muestras 2)
//         //console.log(this.final);

//     //}
//     //Aqui se muestra vacio (se muestras 1)
//     //console.log(final);
//     //console.log("contador total del bucle grande: " + contador_total);
//     //callback(final);
//     //resp.json(fecha_json);
// };
