document.addEventListener("DOMContentLoaded", main);

const LOCAL_STORAGE_KEY = "ATIC:Hide-Side";

function main() {
    const dropdowns = document.querySelectorAll(".sidebar-wrapper [data-atic-toggle]");
    const sideMenuToggler = document.querySelector("#side-menu-toggler");
    sideMenuToggler.addEventListener("click", onSideMenu);
    dropdowns.forEach(element => element.addEventListener("click", onDropDown));
    if (window.localStorage.getItem(LOCAL_STORAGE_KEY) !== null) {
       
        const mainSection = document.querySelector(".main-section");
        mainSection.classList.toggle("hide-side", true);
    }
}

/**
 * Se ejecuta al clickear en un dropdown del sidemenu
 * @param {MouseEvent} event
 */
function onDropDown(event) {
    const target = event.target;
    const dropdown = target.nextElementSibling;

    target.classList.toggle("show");
    dropdown.classList.toggle("custom-show");
}

/**
 * Se ejecuta al presionar el icono de hamburguesa en el topnav
 * @param {MouseEvent} event
 */
function onSideMenu(event) {
    const mainSection = document.querySelector(".main-section");

    mainSection.classList.toggle("hide-side");

    if (mainSection.classList.contains("hide-side")) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, "");

    } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
}