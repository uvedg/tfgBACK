var mongoose = require('mongoose');
var UserSchema = require('../models/users.model');
var ValoracionSchema = require('../models/valoracion.model');
var service = require('../service');
//Añadido para obtener pista
const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');

//Comprueba  la conexcion Front con Back - GET
exports.comprobarConexion = function (req, res){
    res.json({ msg: 'Frontend y Backend conectados.'});
    console.log("Frontend y Backend conectados por consola.");
};

//Crear usuario (REGISTRAR/SIGNUP) - POST
exports.createUser = function (req, res, err) {
	console.log("Estoy en crear usuarios por consola.");
    //Traemos los datos del formulario
    var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var email = req.body.email;
    var password = req.body.password;
    var permiso = req.body.permiso;

    //Validación de campos 
    if (nombre === '') {
        console.log("Error: Campo 'nombre' vacio.");
        return res.send('El campo Nombre está vacío, revisar');
    } else if (apellidos === '') {
        console.log("Error: Campo 'apellidos' vacio.");
        return res.send('El campo Apellidos está vacío, revisar');
    } else if (email === '') {
        console.log("Error: Campo 'email' vacio.");
        return res.send('El campo Email está vacío, revisar');
    } else if (password === '' || password===null) {
        console.log("Error: Campo 'password' vacio.");
        return res.send('El campo Password está vacío, revisar');
    }

    //Creamos el usuario y lo guardamos
    var user = new UserSchema({
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        password: password,
        permiso: permiso
    })

    user.save();

    //Poner mensaje de error si el email es duplicado y no se crea el usuario
};

//Actualizar usuario (EDITAR) - PUT
exports.updateUser = function (req, res) {
	console.log("Estoy en actualizar usuarios por consola.");
    
    UserSchema.findById(req.params.id, function(err, user){
        user.nombre = req.body.nombre;
        user.apellidos = req.body.apellidos;
        user.email = req.body.email;
        user.password = req.body.password;
        user.permiso = req.body.permiso;

        user.save(function(err) {
            if(err) return res.send(500, err.message);
            res.status(200).jsonp(user);
        });
    });
};

//Eliminar usuario (ELIMINAR) - DELETE
exports.deleteUser = function (req, res) {
	UserSchema.findById(req.params.id, function(err, user) {
		user.remove(function(err) {
			if(err) return res.send(500, err.message);
		res.status(200);
		})
	});
};

//Iniciar sesion (LOGIN) 
exports.loginUser = async function(req, res) {
    console.log("Se muestra el req body: ");
    console.log(req.body);
    var email = req.body.email;
    var password = req.body.password;
    
    var usuarioEncontrado; 
    await UserSchema.findOne({email: email, password: password}, function(err, usuario){
        if(err) return console.log('Error al buscar usuario en el login');
        usuarioEncontrado = usuario;
    });
    if(!usuarioEncontrado) res.sendStatus(400);
    else res.status(200).send({token: service.createToken(usuarioEncontrado)});
    //else res.status(401);
    //res.json({ msg: usuarioEncontrado});
};

//Buscar usuario por email (findUser) - GET
exports.findUser = function (req, res) {

    var email_elegido = req.body.email;
    console.log(email_elegido)

    UserSchema.find({email: email_elegido}, function(err, user) {
        if(err) {
            res.send(500, err.message);
        }else {
            console.log(user.permiso);
            console.log(user.email);
            console.log(user);
            res.json(user);
            // if(user.permiso == true && user.email == email_elegido){
            //     res.json(user);
            //     console.log(user);
            // } else {
            //     res.json({ msg: 'Error al buscar usuario.'});
            // }
            
            // console.log("usuario encontrado");
            // console.log(user);
            // res.status(200).json(user);
        } 
    });
}

//Recuperar contraseña usuario por email (recuperarPass) - GET
exports.recuperarPassword = function (req, res) {

    var email_elegido = req.body.email;

    UserSchema.find({email: email_elegido}, function(err, user) {
        if(err) {
            res.send(500, err.message);
        }else {
            console.log(user.passsword);
            console.log(user);
            res.json(user.passsword);
        } 
    });
}

//Cerrar sesion (LOGOUT) - GET
exports.logoutUser = function (req, res, next) {
	if(req.session){
        req.session.destroy(function(err) {
            if(err){
                return next (err);
            } else {
                return res.redirect('http://localhost:3000/api');
            }
        });
    }
};


//Obtener pistas (SCRAPING) - GET
exports.obtenerPista = function (req, resp, callback) {
    //var final = [];
	console.log("Estoy en obtener pista por consola.");
    //Traemos los datos del formulario
    var ubicacion_elegida = req.body.ubicacion;
    var fecha_elegida = req.body.fecha;
    var inicioHora_elegida = req.body.inicioHora;
    var finHora_elegida = req.body.finHora;

    inicioHora_elegida = inicioHora_elegida.toString();
    finHora_elegida = finHora_elegida.toString();

    //Convertir hora para realizar correctamente la validación siguiente
    if(finHora_elegida == "00:00"){
        finHora_elegida = "24:00";
    }

    console.log("La ubicacion es: "+ubicacion_elegida);
    console.log("La fecha es: "+fecha_elegida);
    console.log("La hora inicio es: "+inicioHora_elegida);
    console.log("La hora fin es: "+finHora_elegida);

    //Validación de campos 
    if (inicioHora_elegida >= finHora_elegida) {
        console.log("Error: La hora de fin no puede ser menor a la hora de inicio.");
        return resp.send('La hora de fin es menor que la hora de inicio');
    }

    //Variable con la información de la página web.
    var info;
    //Variables para el manejo de las horas.
    var horas, inicioHora, finHora;
    //Variable para el manejo de las direcciones web.
    var urls;
    //Variable para el manejo de la fecha.
    var fecha;
    //Variable y vector para el manejo del estado (Apuntarse/No disponible/Completa)
    var estado;
    var v_estado = [];
    //Objeto con la información de los resultados
    var resultado;
    //Vector de direcciones url donde se realiza scraping
    var v_url = 
        "http://usuarios.futbolcity.es/partidas/Cuadro.aspx"+"?f="+fecha_elegida+"&c=3";
        //"http://www.padel365.com/Partidas/Cuadro.aspx"+"?f="+fecha_elegida+"&c=3"];
    
    var cont;
    var contador_total= 0;

    //for(cont = 0; cont<v_url.length; cont++) {
        //contador_total++;
        request(v_url, (err, res, body) => {
            //contador_total++;
            if(!err && res.statusCode == 200) {
                let $ = cheerio.load(body);

                //Extracion de la informacion de la web.
                info = $('.TextoLink', '#divContenedorPartidas');

                //Extraccion de la fecha
                fecha = $('.fechaTabla', '#divContenedorPartidas').attr('value');
                
                //Extraccion del estado de la pista (tambien hay botones Amarillo, etc...)
                $('.botonVerdePartidas,.botonAmarilloPartidas,.botonAzulPartidas', '#divContenedorPartidas').each(function () {
                    estado = $(this).text();
                    v_estado.push(estado);
                });

                for(var i=0; i < info.length; i++){
                    
                    //Extraccion de las horas
                    horas = $(info[i]).text().split(" - ");
                    //Separacion entre las horas de inicio y las horas de fin
                    for(var k=0; k < horas.length; k++){
                        inicioHora = horas[0];
                        finHora = horas[1];
                        //inicioHora = inicioHora.toString();
                        //finHora = finHora.toString();
                    }

                    //Extraccion de las direcciones url
                    urls = info[i].attribs.href;

                    //Solo muestra las disponibles para apuntarse/reservar dentro del horario (falta la ubicacion)
                    if(v_estado[i] == "Apuntarse" || v_estado[i] == "RESERVAR"){
                        if(inicioHora >= inicioHora_elegida && finHora <= finHora_elegida){
                            resultado = {'partida': i, 'fecha': fecha, 'estado': v_estado[i], 'inicioHora': inicioHora, 'finHora': finHora, 'url': urls };
                            console.log(resultado);

                            //Creamos el la pista y la guardamos
                            var pista_padel = new PistaSchema({
                                partida: i,
                                //poner unicamente Valencia ahora
                                ubicacion: ubicacion,
                                fecha: fecha,
                                estado: v_estado[i],
                                inicioHora: inicioHora,
                                finHora: finHora,
                                url: urls
                            })
                            pista_padel.save();
                            
                            //this.final.push(resultado);
                            //res.json(final);
                            //Aqui el vector se muestra con los datos correctamente
                            //console.log(final);
                        }
                    }
                }

            }

        });
        //Aqui se muestra vacio (se muestras 2)
        //console.log(this.final);
        
    //}
    //Aqui se muestra vacio (se muestras 1)
    //console.log(final);
    //console.log("contador total del bucle grande: " + contador_total);
    //callback(final);
    //resp.json(fecha_json);
};

//Enviar valoracion (VALORAR) - POST
exports.enviarValoracion = function (req, res, err) {
    console.log("Estoy en enviar valoracion por consola.");
    
    //Extraccion de id
    var id_emisor = req.body.id;
    console.log(id_emisor);
    var id_receptor;
    var email_elegido = req.body.email;
    UserSchema.find({email: email_elegido}, function(err, user) {
        if(err) {
            res.send(500, err.message);
        }else {
            console.log(user._id);
            id_receptor = user._id;
        }
    });


    //Traemos los datos del formulario
    var puntuacion = req.body.puntuacion;
    var descripcion = req.body.descripcion;

    //Creamos la valoracion y lo guardamos
    var valoracion = new ValoracionSchema({
        puntuacion: puntuacion,
        descripcion: descripcion,
        id_emisor: id_emisor,
        id_receptor: id_receptor
    })

    //Poner la id_emisor e id_receptor 

    valoracion.save();
};

//Mostrar valoraciones (VALORAR) - GET
exports.mostrarValoraciones = function (req, res) {
    console.log("Estoy en mostrar valoraciones por consola.");

    //Sustituir por la id del usuario buscado previamente.
    var id_buscado = "b"; 

    
    ValoracionSchema.find({id_receptor: id_buscado}, function(err, valoraciones) {
        if(err){
            res.send(500,err.message);
        }
        else{
            console.log("Se muestras todas las valoraciones");
            console.log(valoraciones);
            res.status(200).json(valoraciones);
        }
    })
};