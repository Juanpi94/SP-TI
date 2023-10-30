import Choices from "choices.js";


const tramite_select = new Choices("#id_tramite", {});


const to_select = new Choices("#id_recipiente", {
    classNames: {containerOuter: "choices col-4 me-3"},
    itemSelectText: "select"
});
const from_select = new Choices("#id_remitente", {
    classNames: {containerOuter: "choices col-4"},
    itemSelectText: "select"
});


const placa_select = new Choices("#id_placa", {
    classNames: {containerOuter: "choices form-select"}
})
const serie_select = new Choices("#id_serie", {
    classNames: {containerOuter: "choices form-select"}
})
let ubicaciones = document.getElementById("ubicaciones").textContent;
ubicaciones = JSON.parse(ubicaciones);
