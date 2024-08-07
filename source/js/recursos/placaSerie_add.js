import Swal from "sweetalert2";
import Choices from "choices.js";
import axios from "axios";

const { placaNoExisteEnTabla, serieNoExisteEnTabla } = require('./placaSerieOnTable.js');

function addPlaqueados(placa, table, plaqueadoMap) {
    // Obtener el valor seleccionado del select
    let selectedPlaca = placa.getValue(true);

    // Validar que el campo no esté vacío
    if (!selectedPlaca || !selectedPlaca.trim()) {
        Swal.fire({ icon: "error", text: "No se pueden agregar una placa vacia a la tabla" })
        return;
    }

    if (placaNoExisteEnTabla(selectedPlaca, table)) {
        axios.get("http://127.0.0.1:8000/api/activos_plaqueados/" + selectedPlaca)
            .then(response1 => {
                let data1 = response1.data;

                let tableData = {
                    placa: data1.placa,
                    serie: data1.serie,
                    descripcion: data1.observacion,
                    marca: data1.marca,
                    modelo: data1.modelo,
                }

                // Hacer la segunda solicitud GET aquí
                return axios.get("http://127.0.0.1:8000/api/ubicaciones/" + data1.ubicacion)
                    .then(response2 => {
                        // Manejar la respuesta de la segunda solicitud aquí
                        let data2 = response2.data;
                        // Agregar los datos de la segunda respuesta a tableData
                        tableData.ubicacion_actual = data2.ubicacion;
                        tableData.ubicacion_actual_id = data2.id;

                        return tableData;
                    });
            })
            .then(tableData => {
                // Agregar los datos filtrados a la tabla
                table.addData(tableData).then(() => {
                    const select = new Choices("#select-" + tableData.placa, { allowHTML: false });
                    plaqueadoMap.set(tableData.placa, {
                        serie: tableData.serie,
                        ubicacion_actual: tableData.ubicacion_actual,
                        ubicacion_actual_id: tableData.ubicacion_actual_id,
                        select
                    });
                });
            })
            .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
        Swal.fire({ icon: "error", text: "La placa ya existe en la tabla" })
        return;
    }
}

function addNoPlaqueados(serie, table, noPlaqueadoMap) {
    let selectedSeries = serie.getValue(true);

    if (!selectedSeries || !selectedSeries.trim()) {
        Swal.fire({ icon: "error", text: "No se puede agregar una serie vacia a la tabla" })
        return;
    }

    if (serieNoExisteEnTabla(selectedSeries, table)) {

        axios.get("http://127.0.0.1:8000/api/activos_no_plaqueados/" + selectedSeries)
            .then(response1 => {
                let data1 = response1.data;

                let tableData = {
                    serie: data1.serie,
                    descripcion: data1.observacion,
                    marca: data1.marca,
                    modelo: data1.modelo,
                }

                // Hacer la segunda solicitud GET aquí
                return axios.get("http://127.0.0.1:8000/api/ubicaciones/" + data1.ubicacion_anterior)
                    .then(response2 => {
                        // Manejar la respuesta de la segunda solicitud aquí
                        let data2 = response2.data;
                        // Agregar los datos de la segunda respuesta a tableData
                        tableData.ubicacion_actual = data2.ubicacion;
                        tableData.ubicacion_actual_id = data2.id;

                        return tableData;
                    });
            })
            .then(tableData => {
                // Agregar los datos filtrados a la tabla
                table.addData(tableData).then(() => {
                    const select = new Choices("#select-" + tableData.serie, { allowHTML: false });
                    noPlaqueadoMap.set(tableData.serie, {
                        ubicacion_actual: tableData.ubicacion_actual,
                        ubicacion_actual_id: tableData.ubicacion_actual_id,
                        select
                    });
                });
            })
            .catch(error => console.error("Error al obtener datos de la API:", error));
    } else {
        Swal.fire({ text: "La serie ya existe en la tabla", icon: "error" })
        return;
    }
}

export { addPlaqueados, addNoPlaqueados };