// eslint-disable-next-line no-unused-vars
import {Options} from "choices.js"

const table = {
    autoColumns: true,
    pagination: true,
    paginationSize: 5,
    paginationSizeSelector: [5, 10, 25, 50, 100],
    locale: true,
    printAsHtml: true,
    langs: {
        "es": {
            "pagination": {
                "first": "Primero",
                "first_title": "Primera Página",
                "last": "Ultimo",
                "last_title": "Ultima Página",
                "prev": "Anterior",
                "prev_title": "Página Anterior",
                "next": "Siguiente",
                "next_title": "Página Siguiente",
                "all": "Todos",
                "counter": {
                    "showing": "Mostrando",
                    "of": "de",
                    "rows": "filas",
                    "pages": "páginas"
                }
            }
        }
    },

};

/**
 *
 * @type {Options} the choices options
 */
const choicesJS = {}

const config = {
    table,
    choicesJS
}


export default config