import {TabulatorFull as Tabulator} from "tabulator-tables";
import config from "./config";


const colDefinitions = [
    {
        title: "Activo", cssClasses: "col-activo", columns: [
            {field: "placa", title: "Placa",},
            {field: "serie", title: "Serie",},
            {field: "ubicacion.instalacion", title: "Zona",},
            {field: "tipo", title: "Tipo",},
            {field: "subtipo", title: "Subtipo",},
            {field: "marca", title: "Marca",},
            {field: "modelo", title: "Modelo",},
            {field: "valor", title: "Valor",},
            {field: "garantia", title: "Garantia",},
            {field: "detalle", title: "Detalle",},
            {field: "estado", title: "Estado",},
            {field: "fecha_ingreso", title: "Ingreso",},
        ]
    },
    {
        title: "Ubicación", columns: [
            {field: "ubicacion_anterior.ubicacion", title: "Ubicación Anterior",},
            {field: "ubicacion.ubicacion", title: "Ubicación Actual",},
            {field: "ubicacion.custodio", title: "Custodio",},
        ]
    },
    {
        title: "Tramites", columns: [
            {field: "tramite.tipo", title: "Tipo de tramite"},
            {field: "tramite.estado", title: "Estado de tramite"},
        ]
    },
    {
        title: "Compra",
        columns: [
            {field: "compra.numero_orden_compra", title: "Orden de Compra"},
            {field: "compra.origen_presupuesto", title: "Origen del presupuesto"},
            {field: "compra.decision_inicial", title: "Decisión Inicial"},
            {field: "compra.numero_solicitud", title: "Numero de Solicitud"},
            {field: "compra.numero_procedimiento", title: "Numero de Procedimiento"},
            {field: "compra.numero_factura", title: "Numero de Facturas"},
            {field: "compra.proveedor", title: "Proveedor"},
            {field: "compra.detalle", title: "Detalle de compra"},
            {field: "compra.informe_tecnico", title: "Informe Técnico"},
        ],
    },

    {
        title: "Red", columns: [
            {field: "red.MAC", title: "MAC"},
            {field: "red.IP", title: "IP"},
            {field: "red.IP_SWITCH", title: "IP SWITCH"},
        ]
    }


]
// eslint-disable-next-line no-unused-vars


const data = document.getElementById("data").textContent;
const json = JSON.parse(data.trim());

const sanitizedJSON = json.map(entry => {

    return {
        ...entry,
        tramite: entry.tramites && entry.tramites.length ? entry.tramites.at(-1) : null
    }
})

function highlightRow(row) {
    const data = row.getData();
    console.log(data);
    if (data.tramite.estado !== undefined && data.tramite.estado !== "Finalizado") {
        row.getElement().classList.add("bg-light-red");
    }
}

// eslint-disable-next-line no-unused-vars
const table = new Tabulator("#tabulator-table", {
    data: sanitizedJSON,
    columns: colDefinitions,
    rowFormatter: highlightRow,
    placeholder: "NA",
    ...config.table,
    autoColumns: false,
});

