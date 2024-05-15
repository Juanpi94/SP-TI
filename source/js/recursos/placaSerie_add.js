import Swal from "sweetalert2";
import Choices from "choices.js";
import axios from "axios";

const { placaNoExisteEnTabla, serieNoExisteEnTabla } = require('./placaSerieOnTable.js');

function addPlaqueados(placa ,table, plaqueadoMap) {
    // Obtener el valor seleccionado del select
    let selectedPlaca = placa.getValue(true);

    // Validar que el campo no esté vacío
    if (!selectedPlaca.trim()) {
        Swal.fire({ icon: "error", text: "No se pueden agregar una placa vacia a la tabla" })
        return;
    }

    if (placaNoExisteEnTabla(selectedPlaca, table)) {
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
                    const select = new Choices(document.querySelector(`#select-${data.placa}`), { allowHTML: true });
                    plaqueadoMap.set(data.placa, select);
                })
            })
            .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
        Swal.fire({ icon: "error", text: "La placa ya existe en la tabla" })
        return;
    }
}

function addNoPlaqueados(serie, table, noPlaqueadoMap) {
    let selectedSerie = serie.value;

    if (!selectedSerie.trim()) {
        Swal.fire({ icon: "error", text: "No se puede agregar una serie vacia a la tabla" })
        return;
    }

    if (serieNoExisteEnTabla(selectedSerie, table)) {

        axios.get("http://127.0.0.1:8000/api/no_plaqueados/" + selectedSerie)
            .then(response => {
                let data = response.data;
                let tableData = {
                    serie: data.serie,
                    ubicacion_actual: data.ubicacion_anterior,
                }
                // Agregar los datos filtrados a la tabla
                table.addData(tableData).then(() => {
                    const select = new Choices("#select-" + data.serie, { allowHTML: true });
                    noPlaqueadoMap.set(data.serie, select)
                });
            })
            .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
        Swal.error({ text: "El activo ya se encuentra en la tabla", icon: "error" })
        return;
    }
}

export { addPlaqueados, addNoPlaqueados };