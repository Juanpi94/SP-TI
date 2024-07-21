import Choices from "choices.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "bootstrap";
import axios from 'axios';
import Swal from "sweetalert2";
import tab from "bootstrap/js/src/tab";
import { addPlaqueados, addNoPlaqueados } from '../recursos/placaSerie_add.js'

const { spaceAction } = require('../recursos/actionSpaces.js')

const plaqueadosMap = new Map();
const noPlaqueadosMap = new Map();
var table = null;

const createChoicesInstance = (id, options) => {
    const element = document.querySelector(id);
    if (element && ['text', 'select-one', 'select-multiple'].includes(element.type)) {
        return new Choices(id, options);
    } else {
        console.error(`Element with id ${id} doesn't exist or is not of the correct type.`);
        return null;
    }
}

const tramiteSelect = createChoicesInstance("#id_tramite", { allowHTML: true });
const toSelect = createChoicesInstance("#id_destinatario", { classNames: { containerOuter: "choices col-4 me-3" }, itemSelectText: "select", allowHTML: true });
const fromSelect = createChoicesInstance("#id_remitente", { classNames: { containerOuter: "choices col-4" }, itemSelectText: "select", allowHTML: true });
const selectPlaca = createChoicesInstance("#id_placa", { classNames: { containerOuter: "choices form-select" }, allowHTML: true });
const selectSerie = createChoicesInstance("#id_serie", { classNames: { containerOuter: "choices form-select" }, allowHTML: true });

const consecutivoTextfield = document.getElementById("id_consecutivo")
const fechaField = document.getElementById("id_fecha")
const detallesField = document.getElementById("id_motivo")

// Botón para generar el PDF
const printButton = document.getElementById("printPDF")
printButton.addEventListener("click", () => {
    let fecha = new Date();
    let fechaFormateada = fecha.toISOString().slice(0, 10);

    const element = document.getElementById("pdf_area");
    html2pdf(element, {
        margin: 1,
        filename: 'traslado-' + consecutivoTextfield.value + '-' + fechaFormateada + '.pdf',
        jsPDF: {
            format: 'letter',
            orientation: 'portrait',
        },
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 3,
            letterRendering: true,
        },
        output: 'save',
    }).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'PDF generado con éxito',
            showConfirmButton: false,
            timer: 2000
        });
    }).catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error al generar el PDF',
            showConfirmButton: false,
            timer: 1500
        });
        console.error(error);
    });
});

// Agrega o reduce el espacio en el (data-spacing="#") en el archivo html
document.addEventListener("DOMContentLoaded", spaceAction());

/**
 * Django necesita el token CSRF por seeguridad, esta función la recupera con el fin
 * de incorporarla en los headers de axios
 * @returns {string} El token CSRF
 */
const getCSRFToken = () => {
    const tokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
    return tokenElement.value;
}

const api = axios.create({
    // eslint-disable-next-line no-undef
    baseURL: `/api/tramites/`, headers: {
        "X-CSRFToken": getCSRFToken(),
        "Content-Type": "application/json"
    }
})

const loadInfo = document.getElementById("loadInfo");
loadInfo.addEventListener("click", () => {
    let consecutivo = document.getElementById("id_tramite");
    axios.get(`/api/tramites/${consecutivo.value}`).then((response) => {
        let data = response.data;
        console.log(data);
        consecutivoTextfield.value = data.referencia;
        let fecha = new Date(data.fecha);
        fechaField.value = fecha.toISOString().slice(0, 10);
        detallesField.value = data.detalles;

        //DE:
        toSelect.setChoiceByValue(data.remitente);

        //PARA:
        fromSelect.setChoiceByValue(data.elaborado_por);

        plaqueadosMap.clear();
        noPlaqueadosMap.clear();

        // for (let placa of data.detalles_placas) {
        //     if (placa.ubicacion_actual && typeof placa.ubicacion_actual._addEventListeners === 'function') {
        //         plaqueadosMap.set(placa.placa, placa.ubicacion_actual);
        //     }
        // }
        // for (let serie of data.detalles_series) {
        //     if (serie.ubicacion_actual && typeof serie.ubicacion_actual._addEventListeners === 'function') {
        //         noPlaqueadosMap.set(serie.serie, serie.ubicacion_actual);
        //     }
        // }

        for (let [_, choice] of plaqueadosMap.entries()) {
            choice._addEventListeners()
        }

        for (let [_, choice] of noPlaqueadosMap.entries()) {
            choice._addEventListeners()
        }

        // console.log(plaqueadosMap);
        // console.log(noPlaqueadosMap);

        //Se encarga de traer el elemento plaqueado y agregarlo en el espacio asignado
        addPlaqueados(selectPlaca, table, plaqueadosMap);

        //Se encarga de traer el elemento no plaqueado y agregarlo en el espacio asignado
        addNoPlaqueados(selectSerie, table, noPlaqueadosMap);

    }).catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar la información',
            showConfirmButton: false,
            timer: 1500
        });
        console.error(error);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    table = new Tabulator("#activos-table", {
        layout: "fitDataStretch",
        placeholder: "No Data Available",
        height: "90%",
        rowHeight: 35,
        columns: [
            { title: "Placa", field: "placa", sorter: "string" },
            // { title: "Descripción", field: "descripcion", sorter: "string" },
            { title: "Marca", field: "marca", sorter: "string" },
            { title: "Modelo", field: "modelo", sorter: "string" },
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

    // table.on("renderComplete", () => {
    //     for (let [_, choice] of plaqueadosMap.entries()) {
    //         // choice._addEventListeners()
    //     }

    //     for (let [_, choice] of noPlaqueadosMap.entries()) {
    //         // choice._addEventListeners()
    //     }
    // });

    //Se encarga de traer el elemento plaqueado y agregarlo en el espacio asignado
    document.getElementById("add_plaqueados").addEventListener("click", () => addPlaqueados(selectPlaca, table, plaqueadosMap));

    //Se encarga de traer el elemento no plaqueado y agregarlo en el espacio asignado
    document.getElementById("add_noPlaqueados").addEventListener("click", () => addNoPlaqueados(selectSerie, table, noPlaqueadosMap));

    //Se encarga generrar el traslado
    let addButtonTraslados = document.getElementById("add-traslado");
    addButtonTraslados.addEventListener("click", () => {
        let detalles = detallesField.value
        let destinatario = parseInt(fromSelect.getValue().value);
        let remitente = parseInt(toSelect.getValue().value);
        let elaborado_por = 1 //Cambiar por el usuario logueado
        let fecha = fechaField.value
        let consecutivo = consecutivoTextfield.value
        let tipo = 1
        let estado = 1

        let detalles_placas = []
        for (let placa of plaqueadosMap.entries()) {
            // Validar que el campo no esté vacío
            if (document.getElementById("select-" + placa[0]).value == '') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear el traslado',
                    text: 'Debe seleccionar una ubicación destino para la placa ' + placa[0] + ' antes de continuar',
                });
                return;
            }

            // Validar que la placa no se encuentre en la misma ubicación
            if (document.getElementById("select-" + placa[0]).value == placa[1].ubicacion_actual_id) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear el traslado',
                    text: 'La placa ' + placa[0] + ' ya se encuentra en la ubicación destino',
                });
                return;
            }

            detalles_placas.push({
                'placa': placa[0],
                'ubicacion_actual': placa[1].ubicacion_actual_id,
                'ubicacion_futura': parseInt(document.getElementById("select-" + placa[0]).value)
            })
        }

        let detalles_series = []
        for (let serie of noPlaqueadosMap.entries()) {
            // Validar que el campo no esté vacío
            if (document.getElementById("select-" + serie[0]).value == '') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear el traslado',
                    text: 'Debe seleccionar una ubicación destino para la serie ' + serie[0] + ' antes de continuar',
                });
                return;
            }

            // Validar que la serie no se encuentre en la misma ubicación
            if (document.getElementById("select-" + serie[0]).value == serie[1].ubicacion_actual_id) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear el traslado',
                    text: 'La serie ' + serie[0] + ' ya se encuentra en la ubicación destino',
                });
                return;
            }

            detalles_series.push({
                'serie': serie[0],
                'ubicacion_actual': serie[1].ubicacion_actual_id,
                'ubicacion_futura': parseInt(document.getElementById("select-" + serie[0]).value)
            })
        }

        let tramiteData = {
            referencia: consecutivo,
            destinatario,
            remitente,
            elaborado_por,
            fecha,
            tipo,
            detalles,
            estado: estado,
        }

        console.table(tramiteData);

        api.post('', tramiteData)
        .then(onCreateSuccess)
        .then(
            
            //agreagar por medio de axios los campos relacionales
            // detalles_placa: detalles_placas,
            // detalles_serie: detalles_series,
        ).catch(onCreateError);
    })
});

/**
 *
 * @param {axios.AxiosResponse} response
 */
function onCreateSuccess(response) {
    Swal.fire({
        icon: "success",
        title: "Registro " + response.data.referencia + " creado con éxito",
    });
}

/**
 *
 * @param {axios.AxiosError} error
 */
function onCreateError(error) {
    if (error.response) {
        // const footer = error.status < 500 ? JSON.stringify(error.response.data) : "Error con el servidor, código 500"
        Swal.fire(
            {
                icon: "error",
                text: "Ocurrió un error al crear el registro",
                footer: JSON.stringify(error.response.data),
            }
        )
    }
}