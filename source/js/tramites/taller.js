import Choices from "choices.js";

const { spaceAction } = require('../recursos/actionSpaces.js')

const desechosSelect = new Choices('select[name="talleres"]', {
  classNames: { containerOuter: "choices col-12 me-3" },
  itemSelectText: 'select',
  allowHTML: true,
});

const placa_select = new Choices("#id_placa", {
  classNames: { containerOuter: "choices form-select" },
  allowHTML: true,
})
const serie_select = new Choices("#id_serie", {
  classNames: { containerOuter: "choices form-select" },
  allowHTML: true,
})

// Agrega o reduce el espacio en el (data-spacing="#") en el archivo html
document.addEventListener("DOMContentLoaded", spaceAction);