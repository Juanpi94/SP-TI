import Choices from "choices.js";



const deshechosSelect = new Choices('select[name="deshechos"]', {
    classNames: { containerOuter: "choices col-12 me-3" },
    itemSelectText: 'select',


});

const placa_select = new Choices("#id_placa", {
    classNames: { containerOuter: "choices form-select" }
})
const serie_select = new Choices("#id_serie", {
    classNames: { containerOuter: "choices form-select" }
})


document.addEventListener('DOMContentLoaded', function () {
    var addSpaceButtons = document.querySelectorAll('[data-action=add]');

    addSpaceButtons.forEach(button => {
        button.addEventListener("click", function () {
            const target = button.dataset.target;
            var targetElement = document.querySelector(`[data-spacing="${target}"]`);


            var currentMargin = parseInt(window.getComputedStyle(targetElement).marginTop);

            targetElement.style.marginTop = (currentMargin + 10) + 'px';


        });
    });

    var reduceSpaceButtons = document.querySelectorAll('[data-action=substract]');

    reduceSpaceButtons.forEach(button => {

        button.addEventListener("click", function () {

            const target = button.dataset.target;

            var targetElement = document.querySelector(`[data-spacing="${target}"]`)

            var currentMargin = parseInt(window.getComputedStyle(targetElement).marginTop);

            if (currentMargin >= 10) {

                targetElement.style.marginTop = (currentMargin - 10) + 'px';
            }
        })
    })
});





















