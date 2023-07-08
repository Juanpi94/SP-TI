import "bootstrap";
import {TabulatorFull as Tabulator} from "tabulator-tables";
import superjson from "superjson";
import Choices from "choices.js";
import axios from "axios";
import * as sweetalert2 from "sweetalert2";
import Swal from "sweetalert2";
import {Exception} from "sass";

const data = document.getElementById("data");

const getCSRFToken = () => {
    const tokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
    return tokenElement.value;
}
const api = axios.create({
    baseURL: `/api/${target_view}/`, headers: {
        "X-CSRFToken": getCSRFToken()
    }
})

const buttons = {
    "add": document.querySelector("[data-atic-action=add]"),
    "deleteSelected": document.querySelector("[data-atic-action=delete-selected]"),
    "print": document.querySelector("[data-atic-action=print]"),
    "exportAll": document.querySelector("[data-atic-action=export-all]"),
    "exportVisibles": document.querySelector("[data-atic-action=export-visible]"),
    "deselect": document.querySelector("[data-atic-action=deselect]"),
};
const addForm = document.querySelector("#add-form");
const editForm = document.querySelector("#edit-form");
/**
 * Tag con el que etiquetar los valores nulos
 * @type {string}
 */
const NULL_TAG = '"---"'
let jsonData = JSON.parse(data.textContent.replaceAll("null", NULL_TAG))


const table = new Tabulator("#tabulator-table", {
    data: jsonData["data"],
    autoColumns: true,
    autoColumnsDefinitions: jsonData["columnDefs"] == "null" ? false : jsonData["columnDefs"],
    pagination: true,
    paginationSize: 5,
    paginationSizeSelector: [5, 10, 25, 50, 100],

});

const addChoices = []
const editChoices = []
const choicesOpts = {}
addForm.querySelectorAll("select").forEach(element => addChoices.push(new Choices(element, choicesOpts)));
editForm.querySelectorAll("select").forEach(element => editChoices.push(new Choices(element, choicesOpts)));

/**
 *
 * @param {HTMLSelectElement} element
 */


table.on("dataLoaded", init_listeners)

function init_listeners() {

    table.on("tableBuilt", addControlColumns);

    // Add table listeners
    table.on("rowSelected", onRowSelected);
    table.on("rowDeselected", onRowDeselected);

    //Add button listeners
    buttons["deselect"].addEventListener("click", onDeselectAll)
    addForm.addEventListener("submit", onCreateRecord);
    editForm.addEventListener("submit", onEditSingle);

    document.querySelector("#form-modal [data-atic-action=submit]").addEventListener("click", () => addForm.requestSubmit());
    document.querySelector("#edit-form-modal [data-atic-action=submit]").addEventListener("click", () => editForm.requestSubmit());
    document.querySelector("#edit-form-modal").addEventListener("show.bs.modal", onShowEditModal)
}

function addControlListeners() {
    document.querySelectorAll("[data-atic-action=delete]").forEach(el => el.addEventListener("click", onDeleteSingle));
    document.querySelectorAll("[data-atic-action=show]").forEach(el => el.addEventListener("click", onShowSingle));
}

function addControlColumns() {
    table.addColumn({
        title: "Controls",
        field: "id",
        formatter: getControlColumn,
        sorter: false,
        headerSort: false,
    }, false,).then(addControlListeners);
    table.addColumn({
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false
    }, true);
}

function getControlColumn(cell) {
    const id = cell.getValue();
    if (typeof id == "undefined") {
        throw new Error("ESTA VISTA REQUIERE DEL ID DE CADA ACTIVO PARA FUNCIONAR");
    }
    return `
    <div class="btn-group">
        <button class="btn btn-primary clr-white" data-bs-toggle="modal" data-bs-target="#edit-form-modal"  data-atic-action="edit" data-atic-id="${id}">
            <i class="bi bi-pencil-fill"></i>
        </button>
        <button class="btn btn-danger clr-white" data-atic-action="delete" data-atic-id="${id}">
            <i class="bi bi-trash-fill"></i>
         </button>
        <button class="btn btn-success clr-white" data-atic-action="show" data-atic-id="${id}">
             <i class="bi bi-eye-fill"></i>
        </button>
    </div>
    `
}


//Listeners
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

    formData.forEach((value, key, parent) => {
        dataObject[key] = value;
    });
    for (let choicesItem of addChoices) {
        const name = choicesItem.passedElement.element.name;

        if (dataObject.hasOwnProperty(name)) {
            dataObject[name] = choicesItem.getValue(true);
        }
    }

    api.post("", dataObject).then(onCreateSuccess).catch(onCreateError);
}


/**
 *
 * @param {MouseEvent} event
 */
async function onShowEditModal(event) {

    if (event.relatedTarget.dataset.hasOwnProperty("aticId")) {
        const id = event.relatedTarget.dataset.aticId;
        const response = await api.get(`${id}`);
        if (response.status >= 200 && response.status < 205) {
            const {data} = response;
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

/**
 * @param {MouseEvent} event
 */
async function onEditSingle(event) {
    event.preventDefault();
    if (event.target.dataset.hasOwnProperty("aticId")) {
        const id = event.target.dataset.aticId;
        const formData = new FormData(editForm);
        const dataObject = {};

        formData.forEach((value, key) => {
            if (value == null || value == "NA") {
                return;
            }
            dataObject[key] = value
        });
        editChoices.forEach(choice => {
            const name = choice.passedElement.element.name;
            dataObject[name] = choice.getValue(true);
        });

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
 */
function onDeleteSingle(event) {

}

/**
 * @param {MouseEvent} event
 */
function onShowSingle(event) {

}

/**
 *
 * @param {axios.AxiosError} error
 */
function onCreateError(error) {
    if (error.response) {
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
    console.log(data)
    table.updateData([data]);
}

/**
 *
 * @param {HTMLFormElement} form
 */
function resetForm(form) {
    form.querySelectorAll("input").forEach(el => el.value = "");

}

