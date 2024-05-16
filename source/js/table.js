import "bootstrap";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import Choices from "choices.js";
import axios from "axios";
import Swal from "sweetalert2";
import _config from "./_config";
import _xlsx from "./_xlsx";
import { Modal } from "bootstrap";
import { formatearFecha } from "./recursos/dateFormat";


/**
 * Django necesita el token CSRF por seeguridad, esta función la recupera con el fin
 * de incorporarla en los headers de axios
 * @returns {string} El token CSRF
 */
const getCSRFToken = () => {
    const tokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
    return tokenElement.value;
}


//SETUP
//Elemento con los datos json del activo
const data = document.getElementById("data");

// Instancia de axios para hacer llamadas al backend
const api = axios.create({
    // eslint-disable-next-line no-undef
    baseURL: `/api/${target_view}/`, headers: {
        "X-CSRFToken": getCSRFToken(),
        "Content-Type": "application/json"
    }
})

// Los botones en la parte superior de la tabla
const buttons = {
    "add": document.querySelector("[data-atic-action=add]"),
    "deleteSelected": document.querySelector("[data-atic-action=delete-selected]"),
    "print": document.querySelector("[data-atic-action=print]"),
    "exportAll": document.querySelector("[data-atic-action=export-all]"),
    "exportVisibles": document.querySelector("[data-atic-action=export-visible]"),
    "deselect": document.querySelector("[data-atic-action=deselect]"),
};
//El input de busqueda
const searchInput = document.querySelector("#search-input")
// El formulario de adición
const addForm = document.querySelector("#add-form");

//El formulario de edición
const editForm = document.querySelector("#edit-form");

//El modal de detalles
const detailModal = document.querySelector("#detail-modal");

/**
 * Tag con el que etiquetar los valores nulos
 * @type {string}
 */
const NULL_TAG = '"---"'

//Se toma el texto del elemento data, se reemplaza los valores nulos con el NULL_TAG y luego se convierte
// En un objecto nativo de javascript
const jsonData = JSON.parse(data.textContent.replaceAll("null", NULL_TAG))
const tabulatorCustomConfig = jsonData["tabulator"]

const columnDefs = tabulatorCustomConfig["columnDefs"] == "null" ? false : tabulatorCustomConfig["columnDefs"]
const autoColumns = tabulatorCustomConfig["autoColumns"] == "null" ? false : tabulatorCustomConfig["autoColumns"]
const id_field = tabulatorCustomConfig["id_field"]
if (id_field == "null") {
    throw new Error("LAS VISTAS DE TABLA REQUIEREN DE UN VALOR PARA EL ID")
}
//Se inicializa la tabla
const table = new Tabulator("#tabulator-table", {
    data: jsonData["data"],
    autoColumns: autoColumns,
    index: id_field,
    columns: columnDefs,
    ..._config.table
});


//Se inicializan los select con ChoicesJS y luego se colocan en arreglos correspondientes
const addChoices = []
const editChoices = []
let fieldChoice = null;

addForm.querySelectorAll("select").forEach(element => addChoices.push(new Choices(element, _config.choicesJS, {allowHTML: true})));
editForm.querySelectorAll("select").forEach(element => editChoices.push(new Choices(element, _config.choicesJS, {allowHTML: true})));


table.on("dataLoaded", init_listeners)

function init_listeners() {

    table.on("tableBuilt", addControlColumns);

    // Add table listeners
    table.on("rowSelected", onRowSelected);
    table.on("rowDeselected", onRowDeselected);

    searchInput.addEventListener("keyup", onSearch);

    let choices = table.getColumns("visible").map((col) => {
        const def = col.getDefinition();

        if (typeof def.title === "undefined" || def.title === "Controls" || def.title === "id") {
            return null;
        }
        return { value: def.field, label: def.title }
    }).filter(choice => choice !== null)

    fieldChoice = new Choices(document.querySelector("#select-field-input"), { choices, shouldSort: false, allowHTML: true });

    //Add button listeners
    buttons["deselect"].addEventListener("click", onDeselectAll)
    buttons["deleteSelected"].addEventListener("click", onDeleteSelected);
    buttons["exportVisibles"].addEventListener("click", onExportVisibles);
    buttons["exportAll"].addEventListener("click", onExportAll);
    buttons["print"].addEventListener("click", onPrint);
    //Add form listeners
    addForm.addEventListener("submit", onCreateRecord);
    editForm.addEventListener("submit", onEditSingle);

    document.querySelector("#add-form-btn").addEventListener("click", () => {
        addForm.querySelectorAll("select").forEach(select => {
            if ((select.value === null || select.value === "") && select.required) {
                const label = addForm.querySelector(`label[for="${select.id}"]`).firstChild.textContent
                Swal.fire({ icon: "warning", text: "Campo " + label + " vacio, verifique los datos" })
                return
            }
        })
        addForm.requestSubmit()
    });
    document.querySelector("#edit-form-btn").addEventListener("click", () => {
        editForm.querySelectorAll("select").forEach(select => {
            if ((select.value === null || select.value === "") && select.required) {
                const label = addForm.querySelector(`label[for="${select.id}"]`).firstChild.textContent
                Swal.fire({ icon: "warning", text: "Campo " + label + " vacio, verifique los datos" })
                return
            }
        })
        editForm.requestSubmit()

    });
    document.querySelector("#edit-form-modal").addEventListener("show.bs.modal", onShowEditModal)
    document.querySelector("#edit-form-modal").addEventListener("hide.bs.modal", onHideEditModal)
}

function addControlListeners() {

    table.on("cellClick", (e, cell) => {
        if (cell.getElement().classList.contains("controls-cell")) {

            const closestBtn = e.target.closest("button");
            if (closestBtn === null) {
                return
            }
            if (typeof closestBtn.dataset !== "undefined" && "aticAction" in closestBtn.dataset) {
                const action = closestBtn.dataset.aticAction;

                if (action === "delete") {
                    onDeleteSingle(e, closestBtn.dataset.aticId);
                } else if (action === "show") {
                    onShowSingle(e, closestBtn.dataset.aticId);
                }
            }
        }
    });


    table.on("cellClick", (e, cell) => {
        const classList = cell.getElement().classList;
        if (classList.contains("controls-cell") || classList.contains("selection-cell")) return;
        const value = cell.getValue();
        if (!value) return;
        navigator.clipboard.writeText(value.toString());

        Swal.fire({
            icon: "success",
            toast: true,
            title: "Copiado",
            position: "bottom",
            showConfirmButton: false,
            timer: 1500,
        })
    });
}

function addControlColumns() {
    table.addColumn({
        title: "Controls",
        field: id_field,
        formatter: getControlColumn,
        cssClass: "controls-cell",
        sorter: false,
        headerSort: false,
        print: false,
    }, false,).then(addControlListeners);
    table.addColumn({
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        cssClass: "selection-cell",
        headerSort: false,
        print: false,
    }, true);
}

function getControlColumn(cell) {
    const id = cell.getValue();
    if (typeof id === "undefined") {
        throw new Error("ESTA VISTA REQUIERE DEL ID DE CADA ACTIVO PARA FUNCIONAR");
    }
    return `
    <div class="btn-group">
        <button class="btn btn-primary clr-white" data-bs-toggle="modal" data-bs-target="#edit-form-modal"  data-atic-action="edit" data-atic-id="${id}">
            <i class="bi bi-pencil-fill user-select-none"></i>
        </button>
        <button class="btn btn-danger clr-white" data-atic-action="delete" data-atic-id="${id}">
            <i class="bi bi-trash-fill user-select-none"></i>
         </button>
        <button class="btn btn-success clr-white" data-atic-action="show" data-atic-id="${id}">
             <i class="bi bi-eye-fill user-select-none"></i>
        </button>
    </div>
    `
}


//Listeners

/**
 *
 * @param {KeyboardEvent} event
 */
function onSearch(event) {
    const value = event.target.value;

    if (value.trim() === "") {
        table.clearFilter();
        return;
    }

    table.setFilter(fieldChoice.getValue(true), "like", value);
}

function onPrint() {
    table.print("all");
}

/**
 *
 * @param {MouseEvent} event
 */
function onExportVisibles(event) {
    const data = [];
    const columns = [];
    const content = table.getData("visible");
    table.getColumns().forEach((col) => {
        const def = col.getDefinition();

        if (typeof def.title === "undefined" || def.title === "Controls") {
            return;
        }
        columns.push({ label: def.title, field: def.field });
    })

    content.forEach(contentData => {
        const rowData = {};
        columns.forEach((col) => {
            rowData[col.label] = contentData[col.field]
        });
        data.push(rowData)
    });

    const xlsx = new _xlsx(data, `export-visibles-${new Date().toISOString()}`, getCSRFToken());

    xlsx.download().catch(console.error);

}

function onExportAll() {
    const data = [];
    const columns = [];
    const content = table.getData("All");
    table.getColumns().forEach((col) => {
        const def = col.getDefinition();

        if (typeof def.title === "undefined" || def.title === "Controls") {
            return;
        }
        columns.push({ label: def.title, field: def.field });
    })

    content.forEach(contentData => {
        const rowData = {};
        columns.forEach((col) => {
            rowData[col.label] = contentData[col.field]
        });
        data.push(rowData)
    });

    const xlsx = new _xlsx(data, `export-all-${new Date().toISOString()}`, getCSRFToken());

    xlsx.download().catch(console.error);
}

function onRowSelected() {
    buttons["deselect"].toggleAttribute("disabled", false);
    buttons["deleteSelected"].toggleAttribute("disabled", false);
}

function onRowDeselected() {
    if (table.getSelectedRows().length === 0) {
        buttons["deselect"].toggleAttribute("disabled", true);
        buttons["deleteSelected"].toggleAttribute("disabled", true);
    }
}

function onDeselectAll() {
    table.deselectRow();
}

/**
 *
 * @param {SubmitEvent} event
 */
async function onCreateRecord(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const dataObject = {};

    formData.forEach((value, key) => {
        if (value.trim() === "") {
            value = null;
        }

        if (key == "fecha") {
            value = formatearFecha(value);
        }
        dataObject[key] = value;

    });
    for (let choicesItem of addChoices) {
        const name = choicesItem.passedElement.element.name;

        if (name in dataObject) {
            dataObject[name] = choicesItem.getValue(true);
        }
    }

    console.table(dataObject)
    api.post("", dataObject).then(onCreateSuccess).catch(onCreateError);
}


/**
 *
 * @param {MouseEvent} event
 */
async function onShowEditModal(event) {

    if ("aticId" in event.relatedTarget.dataset) {
        const id = event.relatedTarget.dataset.aticId;
        const response = await api.get(`${id}`);
        if (response.status >= 200 && response.status < 205) {
            const { data } = response;
            editForm.setAttribute("data-atic-id", id);
            for (const [key, value] of Object.entries(data)) {
                if (value == null || value === "NA") {
                    continue
                }
                const element = editForm.querySelector(`#id_${key}`);

                if (element !== null) {

                    if (element.nodeName === "SELECT") {

                        editChoices.forEach(choice => {
                            if (choice.passedElement.element.id === element.id) {
                                const formmatedValue = Array.isArray(value) ? value.map(val => val.toString()) : value.toString()
                                choice.setChoiceByValue(formmatedValue);
                            }
                        })
                    } else {
                        element.value = value;
                    }
                }
            }
        } else {
            Swal.fire({
                icon: "error",
                text: "No fue posible conseguir los detalles existentes del registro, es posible que la edición no funcione",
            })
        }
    } else {
        Swal.fire({
            icon: "error",
            text: "Ocurrió un error inesperado, no se puede actualizar este activo"
        })
    }
}

function onHideEditModal() {
    resetForm(editForm)
    editChoices.forEach(choice => choice.setChoiceByValue(""));
}

/**
 * @param {MouseEvent} event
 */
async function onEditSingle(event) {
    event.preventDefault();
    if ("aticId" in event.target.dataset) {
        const id = event.target.dataset.aticId;
        const formData = new FormData(editForm);
        const dataObject = {};

        for (const [key, value] of formData.entries()) {
        
            dataObject[key] = value
        };

        editChoices.forEach(choice => {
            const name = choice.passedElement.element.name;
            dataObject[name] = choice.getValue(true);
        });

        console.table(dataObject)

        api.put(`${id}/`, dataObject).then(onEditSuccess).catch(onEditError);
    } else {
        Swal.fire({
            icon: "error",
            text: "Ocurrió un error inesperado, no se puede actualizar este activo"
        })
    }
}

/**
 * @param {MouseEvent} event
 * @param {string} id
 */
function onDeleteSingle(event, id) {
    Swal.fire({
        icon: "warning",
        "text": "¿Seguro que quiere eliminar este registro?",
        showCancelButton: true,
        confirmButtonText: "Eliminar"
    }).then(res => {
        if (res.isConfirmed) {
            if (typeof id == "undefined") {
                Swal.fire({
                    icon: "Error",
                    text: "No es posible eliminar este activo",
                });
                return;
            }
            api.delete(`${id}/`).then((res) => {
                table.deleteRow(table.getRows().filter(row => row.getData()[id_field] == id));
                onDeleteSuccess(res);
            }).catch(onDeleteError);
        }
    });
}

/**
 *
 * @param {MouseEvent} event
 */
async function onDeleteSelected(event) {
    if (table.getSelectedRows().length === 0) {
        return;
    }
    const res = await Swal.fire({
        icon: "warning",
        "text": "Está a punto de eliminar varios registros, ¿Continuar?",
        showCancelButton: true,
    });
    if (res.isConfirmed) {
        const rows = table.getSelectedRows();
        let deletedRows = 0;
        for (const row of rows) {
            const id = row.getIndex();
            try {
                await api.delete(`${id}/`);
                deletedRows++;
                row.delete();
            } catch (e) {
                console.error(e);
            }
        }

        Swal.fire({
            icon: "success",
            text: `Se eliminaron ${deletedRows} registros de ${rows.length}`
        })
    }

}

/**
 * @param {MouseEvent} event
 * @param {string} id
 */
function onShowSingle(event, id) {
    api.get(`${id}`).then(res => {
        const template = detailModal.querySelector("#detail-template");
        const detailBody = detailModal.querySelector(".modal-body");

        let child = detailBody.firstChild;

        while (child) {

            child.remove()
            child = detailBody.firstChild
        }

        for (const key in res.data) {
            const detailSection = template.content.cloneNode(true);
            const title = detailSection.querySelector(".detail-title");
            const info = detailSection.querySelector(".detail-info");
            title.textContent = key;
            info.textContent = res.data[key];
            detailBody.appendChild(detailSection);
        }


        Modal.getOrCreateInstance(detailModal).show();
    }).catch(onShowSingleError);
}

/**
 *
 * @param {axios.AxiosError} error
 */
function onCreateError(error) {
    if (error.response) {
        const footer = error.status < 500 ? JSON.stringify(error.response.data) : "Error con el servidor, código 500"

        Swal.fire(
            {
                icon: "error",
                text: "Ocurrió un error al crear el registro",
                footer: JSON.stringify(error.response.data),
            }
        )
    }
}

/**
 *
 * @param {axios.AxiosResponse} response
 */
function onCreateSuccess(response) {
    Swal.fire({
        icon: "success",
        title: "Registro creado con éxito",
    })
    table.addData([response.data], true);
    resetForm(addForm)
    addChoices.forEach(choice => choice.setChoiceByValue(""));
}

/**
 *
 * @param {axios.AxiosError} error
 */
function onEditError(error) {
    if (error.response) {
        Swal.fire(
            {
                icon: "error",
                text: "Ocurrió un error al editar el registro",
                footer: JSON.stringify(error.response.data),
            }
        )
    }
}

/**
 *
 * @param {axios.AxiosResponse} response
 */
function onEditSuccess(response) {
    Swal.fire({
        icon: "success",
        title: "Modificación realizada con éxito",
    });
    const data = response.data;
    table.updateRow(data[id_field], data);
}

/**
 *
 * @param {axios.AxiosError} error
 */
function onDeleteError(error) {
    if (error) {
        Swal.fire(
            {
                icon: "error",
                text: "Ocurrió un error al eliminar el registro",
                footer: JSON.stringify(error.response.data),
            }
        )
    }
}

/**
 *
 * @param {axios.AxiosResponse} response
 */
function onDeleteSuccess(response) {
    Swal.fire({
        icon: "success",
        title: "Se eliminó el registro con exito",
    });

}

/**
 *
 * @param {axios.AxiosError} response
 */
function onShowSingleError(error) {
    console.error(error)
    Swal.fire({
        icon: "error",
        title: "Hubo un problema al extraer los datos"
    })
}

/**
 *
 * @param {HTMLFormElement} form
 */
function resetForm(form) {
    form.querySelectorAll("input").forEach(el => el.value = "");

}
