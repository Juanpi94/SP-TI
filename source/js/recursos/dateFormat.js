function verificarFormatoFecha(fecha) {
    // Expresión regular para verificar el formato de fecha diferente a YYYY-MM-DD
    var formatoValido = /^(?:(?!^\d{4}-\d{2}-\d{2}$).)*$/;

    if (formatoValido.test(fecha)) {
        return true;  // El formato de fecha no es YYYY-MM-DD
    } else {
        return false; // El formato de fecha es YYYY-MM-DD
    }
}

// Objetivo: Formatear fechas en formato yyyy-mm-dd
function formatearFecha(dateString) {
    if (verificarFormatoFecha(dateString)) {
        const dateArray = dateString.split("/");
        const dateObject = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0];

        return dateObject;
    } else {
        return dateString;
    }
}

function contieneFecha(str) {
    const regex1 = /\bfecha\b/;
    const regex2 = /\bdate\b/;
    
    if (regex1.test(str) || regex2.test(str)) {
        return true;
    } else {
        return false;
    }
}

module.exports = { formatearFecha, contieneFecha };