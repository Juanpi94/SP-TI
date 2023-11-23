import Choices from "choices.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "bootstrap";
import axios from "axios";
import Swal from "sweetalert2";


import { Modal } from "bootstrap";

const tramite_select = new Choices("#id_tramite", {});

const selectMap = new Map();

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

          const placa = row.getData().placa;
          // Obtener el template del select
          const htmlSelectTemplate = document.querySelector("#destinoInput")
          const htmlSelect = htmlSelectTemplate.content.cloneNode(true)
          const selectElement = htmlSelect.querySelector("select");

          selectElement.setAttribute("id", "select-" + placa.toString());
          // Crear un contenedor para el campo de selección
          const container = document.createElement("div")

          container.append(htmlSelect)
          return container.innerHTML
        }
      }
    ]
  });

  // sacar el input y los botones de activos plaqueados y no plaqueados
  let addButtonPlaqueados = document.getElementById("boton_agregar");
  let addButtonNoPlaqueados = document.getElementById("boton_agregar2");

  let ubicacionPlaca = document.getElementById("id_placa");
  let ubicacionSerie = document.getElementById("id_serie");

  //variable para el modal
  let errorModal = new bootstrap.Modal(document.getElementById('errorModal'));

  addButtonPlaqueados.addEventListener("click", function () {
    // Obtener el valor seleccionado del select
    let selectedPlaca = ubicacionPlaca.value;

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
            selectMap.set(data.placa, select)
          });


        })
        .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
      let modalBody = document.querySelector("#errorModal .modal-body");
      modalBody.textContent = "La placa del activo ya existe en la tabla.";


      errorModal.show();
    }

  })

  addButtonNoPlaqueados.addEventListener("click", function () {

    let selectedSerie = ubicacionSerie.value;

    if (serieNoExisteEnTabla(selectedSerie)) {

      axios.get("http://127.0.0.1:8000/api/no_plaqueados/")
        .then(response => {

          let data = response.data

          let activosNoPlaqueados = data.filter(item => item.serie === selectedSerie)

          let tableData = activosNoPlaqueados.map(item => ({
            serie: item.serie,
            ubicacion_actual: item.ubicacion_anterior,

          }));
          // Agregar los datos filtrados a la tabla
          table.addData(tableData);

        })
        .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
      let modalBody = document.querySelector("#errorModal .modal-body");
      modalBody.textContent = "La serie del activo ya existe en la tabla.";


      errorModal.show();
    }

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


