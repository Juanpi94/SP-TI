import Choices from "choices.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "bootstrap";
import axios from "axios";



import { Modal } from "bootstrap";

const tramite_select = new Choices("#id_tramite", {});

const selectMapPlaqueados = new Map();

const selectMapNoPlaqueados = new Map();
let activosPlaqueadosArray = [];


const to_select = new Choices("#id_recipiente", {
  classNames: { containerOuter: "choices col-4 me-3" },
  itemSelectText: "select"
});
const from_select = new Choices("#id_remitente", {
  classNames: { containerOuter: "choices col-4" },
  itemSelectText: "select"
});


const placa_select = new Choices("#id_placa", {
  classNames: { containerOuter: "choices form-select" }
})
const serie_select = new Choices("#id_serie", {
  classNames: { containerOuter: "choices form-select" }
})
let ubicaciones = document.getElementById("ubicaciones").textContent;
ubicaciones = JSON.parse(ubicaciones);


document.addEventListener("DOMContentLoaded", function () {

  // Obténer los botones de "Añadir espacio"
  var addSpaceButtons = document.querySelectorAll('[data-action=add]');

  // for para recorrer todos los botones
  addSpaceButtons.forEach(button => {
    button.addEventListener("click", function () {

      //obtener el elemento target del dataset
      const target = button.dataset.target;
      // Obtén el elemento al que deseas cambiar el margen
      var targetElement = document.querySelector(`[data-spacing="${target}"]`);

      // Obtén el margen actual y conviértelo a número
      var currentMargin = parseInt(window.getComputedStyle(targetElement).marginTop);

      // Aumenta el margen
      targetElement.style.marginTop = (currentMargin + 10) + 'px';

    })
  })
  // Obténer los botones de "Reducir espacio"
  var reduceSpaceButtons = document.querySelectorAll('[data-action=substract]');
  // for para recorrer todos los botones
  reduceSpaceButtons.forEach(button => {

    button.addEventListener("click", function () {
      //obtener el elemento target del dataset
      const target = button.dataset.target;
      // Obtén el elemento al que deseas cambiar el margen
      var targetElement = document.querySelector(`[data-spacing="${target}"]`)
      // Obtén el margen actual y conviértelo a número
      var currentMargin = parseInt(window.getComputedStyle(targetElement).marginTop);

      if (currentMargin >= 10) {
        // Reducir el margen
        targetElement.style.marginTop = (currentMargin - 10) + 'px';
      }
    })
  })

});


///tabla de activos-table


document.addEventListener("DOMContentLoaded", function () {
  let table = new Tabulator("#activos-table", {
    placeholder: "No Data Available",
    layout: "fitColumns",
    height: "100%",

    columns: [
      { title: "Placa", field: "placa", sorter: "string" },
      { title: "Serie", field: "serie", sorter: "string" },
      { title: "Ubicación Actual", field: "ubicacion_actual", sorter: "string" },
      {
        title: "Ubicación Destino", width: 300, field: "placa", sorter: "string", formatter: function (row, data) {

          //obtener la placa de la tabla
          const placaValue = row.getData().placa;
          //obtener la serie de la placa
          const serieValue = row.getData().serie;

          // Obtener el template del select
          const htmlSelectTemplate = document.querySelector("#destinoInput")
          //clonar el template
          const htmlSelect = htmlSelectTemplate.content.cloneNode(true)
          //obtener el select del template
          const selectElement = htmlSelect.querySelector("select");
          //create un contener para alojar el template
          const container = document.createElement("div")

          //validaciones para datos nulos
          if (placaValue !== null && placaValue !== undefined) {
            //se agrega al id el valor "selec-"+ el valor de la placa
            selectElement.setAttribute("id", "select-" + placaValue.toString());
          } else if ((serieValue !== null && serieValue !== undefined)) {
            //se agrega al id el valor "selec-"+ el valor de la serie
            selectElement.setAttribute("id", "select-" + serieValue.toString());
          } else {
            console.error("Error: placaValue y serieValue son undefined o null");
            return "";
          }
          //agregar el template al contenedor
          container.append(htmlSelect)
          //retornar el contenedor
          return container.innerHTML

        }
      }
    ]
  });

  // sacar el input y los botones de activos plaqueados y no plaqueados
  let addButtonPlaqueados = document.getElementById("boton_agregar");
  let addButtonNoPlaqueados = document.getElementById("boton_agregar2");
  let addButtonTraslados = document.getElementById("add-traslado");




  let ubicacionPlaca = document.getElementById("id_placa");
  let ubicacionSerie = document.getElementById("id_serie");
  let ubicacionTextArea = document.getElementById("id_motivo");
  let ubicacionRecipiente = document.getElementById("id_recipiente");
  let ubicacionRemitente = document.getElementById("id_remitente");
  let ubicacionFecha = document.getElementById("id_fecha");
  let ubicacionConsecutivo = document.getElementById("id_consecutivo");
  //variable para el modal
  let errorModal = new bootstrap.Modal(document.getElementById('errorModal'));



  addButtonPlaqueados.addEventListener("click", function () {
    // Obtener el valor seleccionado del select
    let selectedPlaca = ubicacionPlaca.value;


    // Validar que el campo no esté vacío
    if (!selectedPlaca.trim()) {
      let modalBody = document.querySelector("#errorModal .modal-body");
      modalBody.textContent = "No puede agregar campos vacios a la tabla";
      errorModal.show();
      return;
    }

    if (placaNoExisteEnTabla(selectedPlaca)) {
      // Realizar solicitud al API con Axios
      axios.get("http://127.0.0.1:8000/api/plaqueados/" + selectedPlaca)
        .then(response => {
          // Obtener los datos de la respuesta
          let data = response.data;

          // Crear un nuevo array con las propiedades necesarias para la tabla
          let tableData = {
            placa: data.placa,
            serie: data.serie,
            ubicacion_actual: data.ubicacion,
          }
          // Agregar los datos filtrados a la tabla
          table.addData(tableData).then(() => {
            const select = new Choices("#select-" + data.placa);
            selectMapPlaqueados.set(data.placa, select);


            activosPlaqueadosArray.push(
              data.placa
            )


          });

          console.log(activosPlaqueadosArray)
        })
        .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
      let modalBody = document.querySelector("#errorModal .modal-body");
      modalBody.textContent = "La placa del activo ya existe en la tabla.";


      errorModal.show();
      return;
    }

  })

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  addButtonNoPlaqueados.addEventListener("click", function () {

    let selectedSerie = ubicacionSerie.value;

    // Validar que el campo no esté vacío
    if (!selectedSerie.trim()) {
      let modalBody = document.querySelector("#errorModal .modal-body");
      modalBody.textContent = "No puede agregar campos vacios a la tabla";
      errorModal.show();
      return;
    }

    if (serieNoExisteEnTabla(selectedSerie)) {

      axios.get("http://127.0.0.1:8000/api/no_plaqueados/" + selectedSerie)
        .then(response => {

          let data = response.data;


          let tableData = {
            serie: data.serie,
            ubicacion_actual: data.ubicacion_anterior,
          }

          // Agregar los datos filtrados a la tabla
          table.addData(tableData).then(() => {
            const select = new Choices("#select-" + data.serie);
            selectMapNoPlaqueados.set(data.serie, select)
          });

        })
        .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
      let modalBody = document.querySelector("#errorModal .modal-body");
      modalBody.textContent = "La serie del activo ya existe en la tabla.";
      errorModal.show();
      return;
    }

  })


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  //funcion post 

  function getCSRFToken() {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      .split('=')[1];

    return cookieValue;
  }


  addButtonTraslados.addEventListener("click", function () {

    //objeto a pasar al api
    let detalles = ubicacionTextArea.value
    let recipiente = ubicacionRecipiente.value
    let remitente = ubicacionRemitente.value
    let fecha = ubicacionFecha.value
    let consecutivo = ubicacionConsecutivo.value
    let tipo = "Traslado"
    let estado = "Pendiente"

    let traslados = [];

    for (let [placa, destino] in selectMapPlaqueados.entries()) {
      traslados.push(placa, destino)
    }


    let tramiteData = {
      referencia: consecutivo,
      recipiente,
      remitente,
      fecha,
      tipo,
      detalles,
      estado: estado,
      activos_plaqueados: activosPlaqueadosArray,
      traslados

    }

    const csrfToken = getCSRFToken();
    //validar destino
    axios.post('http://127.0.0.1:8000/api/generar/tramite/traslado/', tramiteData, {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json'
      }
    })

      .then(response => {
        response.data;
      })
      .catch(error => {
        console.error('Error:', error.message);
      })

  })

  // Función para verificar si la placa ya existe en la tabla
  function placaNoExisteEnTabla(placa) {
    let rows = table.getData();
    return rows.every(row => row.placa !== placa);
  }

  // Función para verificar si la serie ya existe en la tabla
  function serieNoExisteEnTabla(serie) {
    let rows = table.getData();
    return rows.every(row => row.serie !== serie);
  }

});


