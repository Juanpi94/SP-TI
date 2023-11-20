import Choices from "choices.js";


const deshechosSelect = new Choices('select[name="talleres"]', {
  classNames: {containerOuter: "choices col-12 me-3"},
  itemSelectText: 'select',
});

const placa_select = new Choices("#id_placa", {
  classNames: {containerOuter: "choices form-select"}
})
const serie_select = new Choices("#id_serie", {
  classNames: {containerOuter: "choices form-select"}
})

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
