import Choices from "choices.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "bootstrap";
import axios from 'axios';
import Swal from "sweetalert2";
import tab from "bootstrap/js/src/tab";
import { addPlaqueados, addNoPlaqueados } from '../recursos/placaSerie_add.js'

const { spaceAction } = require('../recursos/actionSpaces.js')
const { getCSRFToken } = require('../recursos/getToken.js')

const plaqueadosMap = new Map();
const noPlaqueadosMap = new Map();

const tramiteSelect = new Choices("#id_tramite", {
  allowHTML: true
});

const toSelect = new Choices("#id_recipiente", {
  classNames: { containerOuter: "choices col-4 me-3" },
  itemSelectText: "select",
  allowHTML: true
});
const fromSelect = new Choices("#id_remitente", {
  classNames: { containerOuter: "choices col-4" },
  itemSelectText: "select",
  allowHTML: true
});

const selectPlaca = new Choices("#id_placa", {
  classNames: { containerOuter: "choices form-select" },
  allowHTML: true
});

const selectSerie = new Choices("#id_serie", {
  classNames: { containerOuter: "choices form-select" },
  allowHTML: true
});

let ubicaciones = document.getElementById("ubicaciones").textContent;

const consecutivoTextfield = document.getElementById("id_consecutivo")
const fechaField = document.getElementById("id_fecha")
const detallesField = document.getElementById("id_motivo")

// Agrega o reduce el espacio en el (data-spacing="#") en el archivo html
document.addEventListener("DOMContentLoaded", spaceAction());

document.addEventListener("DOMContentLoaded", function () {
  let table = new Tabulator("#activos-table", {
    placeholder: "No Data Available",
    layout: "fitColumns",
    height: "100%",
    rowHeight: 42,
    columns: [
      { title: "Placa", field: "placa", sorter: "string" },
      { title: "Serie", field: "serie", sorter: "string" },
      { title: "Ubicación Actual", field: "ubicacion_actual", sorter: "string" },
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

  table.on("renderComplete", () => {
    for (let [_, choice] of plaqueadosMap.entries()) {
      choice._addEventListeners()
    }

    for (let [_, choice] of noPlaqueadosMap.entries()) {
      choice._addEventListeners()
    }
  });

  //Se encarga de traer el elemento plaqueado y agregarlo en el espacio asignado
  document.getElementById("add_plaqueados").addEventListener("click", () => addPlaqueados(selectPlaca, table, plaqueadosMap));

  //Se encarga de traer el elemento no plaqueado y agregarlo en el espacio asignado
  document.getElementById("add_noPlaqueados").addEventListener("click", () => addNoPlaqueados(selectSerie, table, noPlaqueadosMap));

  let addButtonTraslados = document.getElementById("add-traslado");
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

    for (let [placa, destino] of plaqueadosMap.entries()) {
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
      activos_plaqueados: Array.from(plaqueadosMap.keys()),
      traslados

    }
    axios.post('http://127.0.0.1:8000/api/generar/tramite/traslado/', tramiteData, {
      headers: {
        'X-CSRFToken': getCSRFToken(),
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
});