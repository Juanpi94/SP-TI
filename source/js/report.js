import { TabulatorFull as Tabulator } from "tabulator-tables";
import _config from "./_config";
import { format } from "datetime";

// Función para obtener el mapa de modelos desde la base de datos
async function fetchModeloMap() {
    const response = await fetch('/api/modelos'); // Ajusta la URL según tu API
    const data = await response.json();
    const modeloMap = {};
    data.forEach(modelo => {
        modeloMap[modelo.id] = modelo.nombre;
    });
    return modeloMap;
}

async function fetchUbicacionMap(des="ubicacion") {
    const response = await fetch('/api/ubicaciones'); // Ajusta la URL según tu API
    const data = await response.json();
    const ubicacionMap = {};
    if (des === "ubicacion"){
        data.forEach(ubicacion => {
            ubicacionMap[ubicacion.id] = ubicacion.ubicacion;
        });
    } else if (des === "custodio") {
        data.forEach(ubicacion => {
            ubicacionMap[ubicacion.id] = ubicacion.custodio;
        });
    }
    return ubicacionMap;
}

async function fetchTipoMap() {
    const response = await fetch('/api/tipo'); // Ajusta la URL según tu API
    const data = await response.json();
    const tipoMap = {};
    data.forEach(tipo => {
        tipoMap[tipo.id] = tipo.nombre;
    });
    return tipoMap;
}

async function fetchSubtipoMap() {
    const response = await fetch('/api/subtipos'); // Ajusta la URL según tu API
    const data = await response.json();
    const subtipoMap = {};
    data.forEach(subtipo => {
        subtipoMap[subtipo.id] = subtipo.nombre;
    });
    return subtipoMap;
}

async function fetchMarcaMap() {
    const response = await fetch('/api/marcas'); // Ajusta la URL según tu API
    const data = await response.json();
    const marcaMap = {};
    data.forEach(marca => {
        marcaMap[marca.id] = marca.nombre;
    });
    return marcaMap;
}

async function fetchEstadoMap() {
    const response = await fetch('/api/estados'); // Ajusta la URL según tu API
    const data = await response.json();
    const estadoMap = {};
    data.forEach(estado => {
        estadoMap[estado.id] = estado.nombre;
    });
    return estadoMap;
}

async function fetchCustodioMap() {
    const response = await fetch('/api/funcionarios'); // Ajusta la URL según tu API
    const data = await response.json();
    const custodioMap = {};
    data.forEach(custodio => {
        custodioMap[custodio.id] = custodio.nombre_completo;
    });
    return custodioMap;
}

async function fetchCompraMap() {
    const response = await fetch('/api/compra'); // Ajusta la URL según tu API
    const data = await response.json();
    const compraMap = {};
    data.forEach(compra => {
        compraMap[compra.numero_orden_compra] = compra.numero_orden_compra;
    });
    return compraMap;
}

// Función para inicializar la tabla
async function initializeTable() {
    const modeloMap = await fetchModeloMap();
    const ubicacionMap = await fetchUbicacionMap();
    const custodioUbicacionMap = await fetchUbicacionMap("custodio");
    const tipoMap = await fetchTipoMap();
    const subtipoMap = await fetchSubtipoMap();
    const marcaMap = await fetchMarcaMap();
    const estadoMap = await fetchEstadoMap();
    const custodioMap = await fetchCustodioMap();
    const compraMap = await fetchCompraMap();

    const colDefinitions = [
        {
            title: "Activo", cssClasses: "col-activo", columns: [
                { field: "placa", title: "Placa", },
                { field: "serie", title: "Serie", },
                {
                    field: "ubicacion_id",
                    title: "instalación",
                    formatter: function (cell) {
                        // Obtiene el ID de la ubicación
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return ubicacionMap[id] || "Desconocido";
                    }
                },
                {
                    field: "tipo_id",
                    title: "Tipo",
                    formatter: function (cell) {
                        // Obtiene el ID del tipo
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return tipoMap[id] || "Desconocido";
                    }
                },
                {
                    field: "subtipo_id",
                    title: "Subtipo",
                    formatter: function (cell) {
                        // Obtiene el ID del subtipo
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return subtipoMap[id] || "Desconocido";
                    }
                },
                {
                    field: "marca_id",
                    title: "Marca",
                    formatter: function (cell) {
                        // Obtiene el ID de la marca
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return marcaMap[id] || "Desconocido";
                    }
                },
                {
                    field: "modelo_id",
                    title: "Modelo",
                    formatter: function (cell) {
                        // Obtiene el ID del modelo
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return modeloMap[id] || "Desconocido";
                    }
                },
                { field: "valor_colones", title: "Valor colones", },
                { field: "valor_dolares", title: "Valor dolares", },
                { field: "garantia", title: "Garantia", },
                { field: "detalle", title: "Detalle", },
                {
                    field: "estado_id",
                    title: "Estado",
                    formatter: function (cell) {
                        // Obtiene el ID del estado
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return estadoMap[id] || "Desconocido";
                    }
                },
                { field: "fecha_ingreso", title: "Ingreso", },
            ]
        },
        {
            title: "Ubicación", columns: [
                {
                    field: "ubicacion_anterior_id",
                    title: "Ubicación Anterior",
                    formatter: function (cell) {
                        // Obtiene el ID de la ubicación
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return ubicacionMap[id] || "Desconocido";
                    }
                },
                {
                    field: "ubicacion_id",
                    title: "Ubicación Actual",
                    formatter: function (cell) {
                        // Obtiene el ID de la ubicación
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return ubicacionMap[id] || "Desconocido";
                    }
                },
                {
                    field: "ubicacion_id",
                    title: "Custodio",
                    formatter: function (cell) {
                        // Obtiene el ID de la ubicación
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        const cust = custodioUbicacionMap[id]
                        return custodioMap[cust] || "Desconocido";
                    }
                },
            ]
        },
        {
            title: "Tramites", columns: [
                { 
                    field: "tramite.tipo", 
                    title: "Tipo de tramite",
                    formatter: function (cell) {
                        // Obtiene el ID de la ubicación
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        
                    }
                },
                { field: "tramite.estado", title: "Estado de tramite" },
            ]
        },
        {
            title: "Compra", columns: [
                { 
                    field: "compra_id", 
                    title: "Orden de Compra",
                    formatter: function (cell) {
                        // Obtiene el ID de la ubicación
                        const id = cell.getValue();
                        // Retorna el valor correspondiente del mapa
                        return compraMap[id] || "Desconocido";
                    }
                    
                },
                { field: "compra.origen_presupuesto", title: "Origen del presupuesto" },
                { field: "compra.decision_inicial", title: "Decisión Inicial" },
                { field: "compra.numero_solicitud", title: "Numero de Solicitud" },
                { field: "compra.numero_procedimiento", title: "Numero de Procedimiento" },
                { field: "compra.numero_factura", title: "Numero de Facturas" },
                { field: "compra.proveedor", title: "Proveedor" },
                { field: "compra.detalle", title: "Detalle de compra" },
                { field: "compra.informe_tecnico", title: "Informe Técnico" },
            ],
        },
        {
            title: "Red", columns: [
                { field: "red.MAC", title: "MAC" },
                { field: "red.IP", title: "IP" },
                { field: "red.IP_SWITCH", title: "IP SWITCH" },
            ]
        }
    ];

    // eslint-disable-next-line no-unused-vars
    const data = document.getElementById("data").textContent;
    const json = JSON.parse(data.trim());

    const sanitizedJSON = json.map(entry => {
        return {
            ...entry,
            tramite: entry.tramites && entry.tramites.length ? entry.tramites.at(-1) : null
        }
    });

    function highlightRow(row) {
        const data = row.getData();
        // console.log(data);
        if (data.tramite.estado !== undefined && data.tramite.estado !== "Pendiente") {
            row.getElement().classList.add("bg-light-red");
        }
        if (data.tramite.estado !== undefined && data.tramite.estado !== "Aceptado") {
            row.getElement().classList.add("bg-light-yellow");
        }
        if (data.tramite.estado !== undefined && data.tramite.estado !== "En Proceso") {
            row.getElement().classList.add("bg-light-blue");
        }
    }

    // eslint-disable-next-line no-unused-vars
    const table = new Tabulator("#tabulator-table", {
        data: sanitizedJSON,
        columns: colDefinitions,
        rowFormatter: highlightRow,
        placeholder: "NA",
        ..._config.table,
        autoColumns: false,
    });
}

// Llama a la función para inicializar la tabla
initializeTable();