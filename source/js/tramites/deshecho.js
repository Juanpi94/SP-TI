import Choices from "choices.js";


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





















