var url = window.location.href;
var swLocation = "/sw.js";

var swReg;

if (navigator.serviceWorker) {
  if (url.includes("localhost")) {
    swLocation = "/sw.js";
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker.register(swLocation).then(function (reg) {
      swReg = reg;
      swReg.pushManager.getSubscription().then(verificaSuscripcion);
    });
  });
}

// Referencias de jQuery
var googleMapKey = "AIzaSyA5mjCwx1TRLuBAjwQw84WE6h5ErSe7Uj8";

var titulo = $("#titulo");
var nuevoBtn = $("#nuevo-btn");
var salirBtn = $("#salir-btn");
var cancelarBtn = $("#cancel-btn");
var postBtn = $("#post-btn");
var avatarSel = $("#seleccion");
var timeline = $("#timeline");

var modal = $("#modal");
var modalAvatar = $("#modal-avatar");
var avatarBtns = $(".seleccion-avatar");
var txtMensaje = $("#txtMensaje");

var btnActivadas = $(".btn-noti-activadas");
var btnDesactivadas = $(".btn-noti-desactivadas");

var btnLocation = $("#location-btn");

var modalMapa = $(".modal-mapa");

var btnTomarFoto = $("#tomar-foto-btn");
var btnPhoto = $("#photo-btn");
var contenedorCamara = $(".camara-contenedor");

var btnGrabarVideo = $("#grabar-video-btn");
var btnDetenerVideo = $("#detener-video-btn");

var lat = null;
var watchId = null;
var lng = null;
var foto = null;
var lastUpdate = 0;
var videoGrabado = null; // Variable para almacenar el video Base64

// El usuario, contiene el ID del héroe seleccionado
var usuario;

// Init de la camara class
// document.getElementById('player');
const camara = new Camara($("#player")[0]);

// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje, lat, lng, foto, video) {
  // console.log(mensaje, personaje, lat, lng);

  var content = `
    <li class="animated fadeIn fast"
        data-user="${personaje}"
        data-mensaje="${mensaje}"
        data-tipo="mensaje">


        <div class="avatar">
            <img src="img/avatars/${personaje}.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${personaje}</h3>
                <br/>
                ${mensaje}
                `;

  if (foto) {
    content += `
                <br>
                <img class="foto-mensaje" src="${foto}">
        `;
  }

  if (video) {
    content += `
                <br>
                <video src="${video}" controls style="width: 100%; max-height: 250px; border-radius: 10px; margin-top: 10px;"></video>
        `;
  }

  content += `</div>        
                <div class="arrow"></div>
            </div>
        </li>
    `;

  // si existe la latitud y longitud,
  // llamamos la funcion para crear el mapa
  if (lat) {
    crearMensajeMapa(lat, lng, personaje);
  }

  // Borramos la latitud y longitud por si las usó
  lat = null;
  lng = null;

  $(".modal-mapa").remove();

  timeline.prepend(content);
  cancelarBtn.click();
}

function crearMensajeMapa(lat, lng, personaje) {
  let content = `
    <li class="animated fadeIn fast"
        data-tipo="mapa"
        data-user="${personaje}"
        data-lat="${lat}"
        data-lng="${lng}">
                <div class="avatar">
                    <img src="img/avatars/${personaje}.jpg">
                </div>
                <div class="bubble-container">
                    <div class="bubble">
                        <iframe
                            width="100%"
                            height="250"
                            frameborder="0" style="border:0"
                            src="https://www.google.com/maps/embed/v1/view?key=${googleMapKey}&center=${lat},${lng}&zoom=17" allowfullscreen>
                            </iframe>
                    </div>
                    
                    <div class="arrow"></div>
                </div>
            </li> 
    `;

  timeline.prepend(content);
}

// Globals
function logIn(ingreso) {
  if (ingreso) {
    nuevoBtn.removeClass("oculto");
    salirBtn.removeClass("oculto");
    timeline.removeClass("oculto");
    avatarSel.addClass("oculto");
    modalAvatar.attr("src", "img/avatars/" + usuario + ".jpg");
  } else {
    nuevoBtn.addClass("oculto");
    salirBtn.addClass("oculto");
    timeline.addClass("oculto");
    avatarSel.removeClass("oculto");

    titulo.text("Seleccione Personaje");
  }
}

// Seleccion de personaje
avatarBtns.on("click", function () {
  usuario = $(this).data("user");

  titulo.text("@" + usuario);

  logIn(true);
});

// Boton de salir
salirBtn.on("click", function () {
  logIn(false);
});

// Boton de nuevo mensaje
nuevoBtn.on("click", function () {
  modal.removeClass("oculto");
  modal.animate(
    {
      marginTop: "-=1000px",
      opacity: 1,
    },
    200,
  );
});

// Boton de cancelar mensaje
cancelarBtn.on("click", function () {
  if (!modal.hasClass("oculto")) {
    modal.animate(
      {
        marginTop: "+=1000px",
        opacity: 0,
      },
      200,
      function () {
        modal.addClass("oculto");
        modalMapa.addClass("oculto");
        txtMensaje.val("");
        videoGrabado = null; // Limpiar variable de video al cancelar
      },
    );
  }
});

// Boton de enviar mensaje
postBtn.on("click", function () {
  var mensaje = txtMensaje.val();
  if (mensaje.length === 0) {
    cancelarBtn.click();
    return;
  }

  var data = {
    mensaje: mensaje,
    user: usuario,
    lat: lat,
    lng: lng,
    foto: foto,
    video: videoGrabado,
  };

  fetch("api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => console.log("app.js", res))
    .catch((err) => console.log("app.js error:", err));

  crearMensajeHTML(mensaje, usuario, lat, lng, foto, videoGrabado);

  foto = null;
  videoGrabado = null; // Limpiar al enviar
});

// Obtener mensajes del servidor
function getMensajes() {
  fetch("api")
    .then((res) => res.json())
    .then((posts) => {
      console.log(posts);

      posts.forEach((post) =>
        crearMensajeHTML(
          post.mensaje,
          post.user,
          post.lat,
          post.lng,
          post.foto,
          post.video
        ),
      );
    });
}

getMensajes();

// Detectar cambios de conexión
function isOnline() {
  if (navigator.onLine) {
    // tenemos conexión
    // console.log('online');
    $.mdtoast("Online", {
      interaction: true,
      interactionTimeout: 1000,
      actionText: "OK!",
    });
  } else {
    // No tenemos conexión
    $.mdtoast("Offline", {
      interaction: true,
      actionText: "OK",
      type: "warning",
    });
  }
}

window.addEventListener("online", isOnline);
window.addEventListener("offline", isOnline);

isOnline();

// Notificaciones
function verificaSuscripcion(activadas) {
  if (activadas) {
    btnActivadas.removeClass("oculto");
    btnDesactivadas.addClass("oculto");
  } else {
    btnActivadas.addClass("oculto");
    btnDesactivadas.removeClass("oculto");
  }
}

function enviarNotificacion() {
  const notificationOpts = {
    body: "Este es el cuerpo de la notificación",
    icon: "img/icons/icon-72x72.png",
  };

  const n = new Notification("Hola Mundo", notificationOpts);

  n.onclick = () => {
    console.log("Click");
  };
}

function notificarme() {
  if (!window.Notification) {
    console.log("Este navegador no soporta notificaciones");
    return;
  }

  if (Notification.permission === "granted") {
    // new Notification('Hola Mundo! - granted');
    enviarNotificacion();
  } else if (
    Notification.permission !== "denied" ||
    Notification.permission === "default"
  ) {
    Notification.requestPermission(function (permission) {
      console.log(permission);

      if (permission === "granted") {
        // new Notification('Hola Mundo! - pregunta');
        enviarNotificacion();
      }
    });
  }
}

// notificarme();

// Get Key
function getPublicKey() {
  // fetch('api/key')
  //     .then( res => res.text())
  //     .then( console.log );

  return (
    fetch("api/key")
      .then((res) => res.arrayBuffer())
      // returnar arreglo, pero como un Uint8array
      .then((key) => new Uint8Array(key))
  );
}

// getPublicKey().then( console.log );
btnDesactivadas.on("click", function () {
  if (!swReg) return console.log("No hay registro de SW");

  getPublicKey().then(function (key) {
    swReg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      })
      .then((res) => res.toJSON())
      .then((suscripcion) => {
        // console.log(suscripcion);
        fetch("api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(suscripcion),
        })
          .then(verificaSuscripcion)
          .catch(cancelarSuscripcion);
      });
  });
});

function cancelarSuscripcion() {
  swReg.pushManager.getSubscription().then((subs) => {
    subs.unsubscribe().then(() => verificaSuscripcion(false));
  });
}

btnActivadas.on("click", function () {
  cancelarSuscripcion();
});

// Crear mapa en el modal
function mostrarMapaModal(lat, lng) {
  $(".modal-mapa").remove();

  var content = `
            <div class="modal-mapa">
                <iframe
                    width="100%"
                    height="250"
                    frameborder="0"
                    src="https://www.google.com/maps/embed/v1/view?key=${googleMapKey}&center=${lat},${lng}&zoom=17" allowfullscreen>
                    </iframe>
            </div>
    `;

  modal.append(content);
}

// Sección 11 - Recursos Nativos

// Obtener la geolocalización
// Obtener la geolocalización
btnLocation.on("click", () => {
  const tiempoValidez = 60000;
  const ahora = Date.now();

  if (lat !== null && lng !== null && ahora - lastUpdate < tiempoValidez) {
    $.mdtoast("Usando ubicacion reciente guardada en cache", {
      interactionTimeout: 2000,
      actionText: "Ok!",
    });

    mostrarMapaModal(lat, lng);
    return;
  }
  //Verificar si el navegador soporta la API de Geolocalización
  if (!("geolocation" in navigator) || !navigator.geolocation) {
    $.mdtoast("Tu navegador no soporta geolocalización", {
      interaction: true,
      interactionTimeout: 3000,
      actionText: "OK",
      type: "warning",
    });
    return;
  }
  if (watchId !== null) {
    $.mdtoast("Ya se está rastreando tu ubicación", {
      interactionTimeout: 2000,
      actionText: "Ok!",
    });
    return;
  }

  //El navegador sí es compatible → continuar normalmente
  $.mdtoast("Realizando seguimiento de tu ubicacion", {
    interaction: true,
    interactionTimeout: 2000,
    actionText: "Ok!",
  });

  //Definir callback de error para manejar los casos del sistema/usuario
  const errorGeo = (error) => {
    let mensaje = "";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        mensaje =
          "Permiso de ubicación denegado. Habilítalo en la configuración del navegador.";
        break;
      case error.POSITION_UNAVAILABLE:
        mensaje = "Información de ubicación no disponible en este momento.";
        break;
      case error.TIMEOUT:
        mensaje = "Se agotó el tiempo de espera máximo para obtener la ubicación y cargar el mapa.";
        break;
      default:
        mensaje = "Error desconocido al obtener la ubicación.";
    }

    $.mdtoast(mensaje, {
      interaction: true,
      interactionTimeout: 4000,
      actionText: "OK",
      type: "warning",
    });
    watchId = null;
  };

  //Obtener posición con ambos callbacks
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      console.log("Ubicación actualizada:", pos);
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      lastUpdate = Date.now();
      mostrarMapaModal(lat, lng);
    },
    errorGeo, // <-- callback de error
    {
      // <-- opciones opcionales
      timeout: 15000, // Tiempo de espera máximo establecido en 15 segundos (15000 ms)
      maximumAge: 0, // 0 obliga a forzar una lectura nueva y más precisa, ignorando el caché del dispositivo
      enableHighAccuracy: true, // solicitar GPS si está disponible
    },
  );
});

// Boton de la camara
// usamos la funcion de fleca para prevenir
// que jQuery me cambie el valor del this
btnPhoto.on("click", () => {
  console.log("Inicializar camara");
  contenedorCamara.removeClass("oculto");

  camara.encender();
});

// Boton para tomar la foto
btnTomarFoto.on("click", () => {
  console.log("Botón tomar foto");

  foto = camara.tomarFoto();

  camara.apagar();

  // console.log(foto);
});

// Boton para iniciar grabación de video
btnGrabarVideo.on("click", () => {
  try {
    camara.iniciarGrabacion();
    
    btnGrabarVideo.addClass("oculto");
    btnDetenerVideo.removeClass("oculto");
    $.mdtoast("Grabando video...", { interactionTimeout: 2000, actionText: "Ok" });
  } catch (err) {
    // Validacion de errores visual para el usuario
    $.mdtoast("Error: " + err.message, { interaction: true, type: "error", actionText: "Ok" });
  }
});

// Boton para detener grabación de video
btnDetenerVideo.on("click", () => {
  btnDetenerVideo.addClass("oculto");
  btnGrabarVideo.removeClass("oculto");
  
  camara.detenerGrabacion()
    .then(videoBase64 => {
      videoGrabado = videoBase64;
      camara.apagar();
      $.mdtoast("Video capturado con éxito", { interactionTimeout: 3000, actionText: "Ok", type: "success" });
    })
    .catch(err => {
      $.mdtoast("Error al detener la grabación: " + err, { interaction: true, type: "error", actionText: "Ok" });
    });
});

// Share API

// if ( navigator.share ) {
//     console.log('Navegador lo soporta');
// } else {
//     console.log('Navegador NO lo soporta');
// }

timeline.on("click", "li", function () {
  // console.log(  $(this)  );

  let tipo = $(this).data("tipo");
  let lat = $(this).data("lat");
  let lng = $(this).data("lng");
  let mensaje = $(this).data("mensaje");
  let user = $(this).data("user");

  console.log({ tipo, lat, lng, mensaje, user });

  const shareOpts = {
    title: user,
    text: mensaje,
  };

  if (tipo === "mapa") {
    shareOpts.text = "Mapa";
    shareOpts.url = `https://www.google.com/maps/@${lat},${lng},15z`;
  }

  navigator
    .share(shareOpts)
    .then(() => console.log("Successful share"))
    .catch((error) => console.log("Error sharing", error));
});
