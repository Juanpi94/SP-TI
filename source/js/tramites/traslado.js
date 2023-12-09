import Choices from "choices.js";
import {TabulatorFull as Tabulator} from "tabulator-tables";
import "bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import tab from "bootstrap/js/src/tab";

const tramiteSelect = new Choices("#id_tramite", {});
const selectMapPlaqueados = new Map();
const selectMapNoPlaqueados = new Map();
const toSelect = new Choices("#id_recipiente", {
  classNames: {containerOuter: "choices col-4 me-3"},
  itemSelectText: "select"
});
const fromSelect = new Choices("#id_remitente", {
  classNames: {containerOuter: "choices col-4"},
  itemSelectText: "select"
});


const placaSelect = new Choices("#id_placa", {
  classNames: {containerOuter: "choices form-select"}
})
const serieSelect = new Choices("#id_serie", {
  classNames: {containerOuter: "choices form-select"}
})
let ubicaciones = document.getElementById("ubicaciones").textContent;

const consecutivoTextfield = document.getElementById("id_consecutivo")
const fechaField = document.getElementById("id_fecha")
const detallesField = document.getElementById("id_motivo")
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
  var reduceSpaceButtons = document.querySelectorAll('[data-action=substract]');
  reduceSpaceButtons.forEach(button => {

    button.addEventListener("click", function () {
      const target = button.dataset.target;
      var targetElement = document.querySelector(`[data-spacing="${target}"]`)
      var currentMargin = parseInt(window.getComputedStyle(targetElement).marginTop);

      if (currentMargin >= 10) {
        targetElement.style.marginTop = (currentMargin - 10) + 'px';
      }
    })
  })

});

document.addEventListener("DOMContentLoaded", function () {
  let table = new Tabulator("#activos-table", {
    placeholder: "No Data Available",
    layout: "fitColumns",
    height: "100%",
    rowHeight: 42,
    columns: [
      {title: "Placa", field: "placa", sorter: "string"},
      {title: "Serie", field: "serie", sorter: "string"},
      {title: "Ubicación Actual", field: "ubicacion_actual", sorter: "string"},
      {
        title: "Ubicación Destino", width: 300, field: "placa", sorter: "string", formatter: function (row) {

          const placaValue = row.getData().placa;
          const serieValue = row.getData().serie;

          const htmlSelectTemplate = document.querySelector("#destinoInput")
          const htmlSelect = htmlSelectTemplate.content.cloneNode(true)
          const selectElement = htmlSelect.querySelector("select");
          const container = document.createElement("div")

          if (placaValue !== null && placaValue !== undefined) {
            selectElement.setAttribute("id", "select-" + placaValue.toString());
          } else if ((serieValue !== null && serieValue !== undefined)) {
            selectElement.setAttribute("id", "select-" + serieValue.toString());
          } else {
            console.error("Error: placaValue y serieValue son undefined o null");
            return "";
          }
          container.append(htmlSelect)

          return container.innerHTML

        }
      }
    ]
  });

  let addButtonPlaqueados = document.getElementById("boton_agregar");
  let addButtonNoPlaqueados = document.getElementById("boton_agregar2");
  let addButtonTraslados = document.getElementById("add-traslado");

  table.on("renderComplete", () => {
    for (let [_, choice] of selectMapPlaqueados.entries()) {
      choice._addEventListeners()
    }
  })
  addButtonPlaqueados.addEventListener("click", function () {
    // Obtener el valor seleccionado del select
    let selectedPlaca = placaSelect.getValue(true);
    // Validar que el campo no esté vacío
    if (!selectedPlaca.trim()) {
      Swal.fire({icon: "error", text: "No se pueden agregar una placa vacia a la tabla"})
      return;
    }

    if (placaNoExisteEnTabla(selectedPlaca)) {
      axios.get("http://127.0.0.1:8000/api/plaqueados/" + selectedPlaca)
        .then(response => {
          /**
           * @type {Plaqueado}
           */
          let data = response.data;
          let tableData = {
            placa: data.placa,
            serie: data.serie,
            ubicacion_actual: data.ubicacion?.ubicacion || "",
          }

          table.addData(tableData).then(() => {
            const select = new Choices(document.querySelector(`#select-${data.placa}`));
            selectMapPlaqueados.set(data.placa, select);
          })
        })
        .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
      Swal.fire({icon: "error", text: "La placa ya existe en la tabla"})
      return;
    }
  })

  addButtonNoPlaqueados.addEventListener("click", function () {
    let selectedSerie = serieSelect.value;

    if (!selectedSerie.trim()) {
      Swal.fire({icon: "error", text: "No se puede agregar una serie vacia a la tabla"})
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
      Swal.error({text: "El activo ya se encuentra en la tabla", icon: "error"})
      return;
    }
  })

  function getCSRFToken() {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      .split('=')[1];

    return cookieValue;
  }

  addButtonTraslados.addEventListener("click", function () {
    let detalles = detallesField.value
    let recipiente = toSelect.value
    let remitente = fromSelect.value
    let fecha = fechaField.value
    let consecutivo = consecutivoTextfield.value
    let tipo = "Traslado"
    let estado = "Pendiente"

    let traslados = {
      "plaqueados": {},
      "no_plaqueados": {}
    };

    for (let [placa, destino] of selectMapPlaqueados.entries()) {
      traslados["plaqueados"][placa] = destino.getValue(true)
    }


    let tramiteData = {
      referencia: consecutivo,
      recipiente,
      remitente,
      fecha,
      tipo,
      detalles,
      estado: estado,
      activos_plaqueados: Array.from(selectMapPlaqueados.keys()),
      traslados

    }
    const csrfToken = getCSRFToken();
    axios.post('http://127.0.0.1:8000/api/generar/tramite/traslado/', tramiteData, {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        Swal.fire({
          icon: "success",
          text: "El tramite se cargó con éxito"
        })
      })
      .catch(error => {

        let msg = "Error desconocido al agregar el trámite"
        const errorData = error.response.data;

        if (Object.hasOwn(errorData, "referencia") && errorData["referencia"][0] === "unique") {
          msg = "Ya existe un trámite con esta referencia"
        } else if (Object.hasOwn(errorData, "detalles") && errorData["detalles"][0] === "blank") {
          msg = "El detalle está vacio, debe agregarlo"
        }
        Swal.fire({
          icon: "error",
          text: msg
        })
      })

  })

  function placaNoExisteEnTabla(placa) {
    let rows = table.getData();
    return rows.every(row => row.placa !== placa);
  }

  function serieNoExisteEnTabla(serie) {
    let rows = table.getData();
    return rows.every(row => row.serie !== serie);
  }

});


