const { default: Swal } = require('sweetalert2');

function loadingDatas() {
    Swal.fire({
        title: "Cargando datos",
        html: "Por favor, espera mientras se cargan los datos...",
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function updateDatas() {
    Swal.fire({
        title: "Actualizando datos",
        html: "Por favor, espera mientras se actualizan los datos...",
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function updateActivated() {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: "info",
        title: "Actualización Activada",
        text: "Se actualizarán los datos existentes",
    });
}

function loadSuccess() {
    Swal.fire({
        icon: "success",
        title: "Datos cargados con éxito",
        text: "Se ha generado un informe con los datos no válidos",
    });
}

function noLoadDatas() {
    Swal.fire({
        icon: "info",
        title: "Sin datos nuevos para cargar",
    });
}

function updateSuccess() {
    Swal.fire({
        icon: "success",
        title: "Datos actualizados con éxito",
    });
}

function errFile() {
    Swal.fire({
        icon: "error",
        title: "Error al leer el archivo",
        text: "Verifica que esté correctamente cargado",
    });
}

function updateDeactivated() {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: "success",
        title: "Actualización Desactivada",
    });
}

function notUpdateData() {
    Swal.fire({
        icon: "info",
        title: "Sin datos para actualizar",
        text: "No se encontraron datos para actualizar",
    });
}

export {
    updateActivated, loadSuccess, updateDeactivated,
    updateSuccess, loadingDatas, errFile, updateDatas,
    notUpdateData, noLoadDatas
};
