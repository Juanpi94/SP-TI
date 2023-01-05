import { axiosInstance, download, getCsrf, toExcel } from "./utils";
import Swal from "sweetalert2";

import { Buffer } from "buffer";
import axios from "axios";

//Este archivo utiliza variables que se declaran en table.html
const swalAlertTimer = 1200; //El tiempo en que las alertas de sweetAlert tardan en estar visibles: https://sweetalert2.github.io/

//Se inicializan los select, si existen
if ($("select").length) {
	$("select").select2({
		language: {
			noResults: () => "No hay resultados para esta busqueda",
		},
		theme: "default",
		dropdownParent: $("#form-modal .modal-body form"),
	});

	$("select")
		.data("select2")
		.on("open", function () {
			if (this) {
				this.dropdown._positionDropdown();
			}
		});
}

// Esta función se encarga de inicializar la tabla
let table = $("#datatable").DataTable({
	ajax: { url: target_view, dataSrc: "" },
	language: {
		emptyTable: "Aún no hay datos para esta tabla",
		zeroRecords: "No hay resultados para esta busqueda",
	},
	buttons: [
		{
			text: "Añadir",
			className: "btn mt-3 btn-add",
			action: () => {
				$("#form")[0].reset();
				$("#form-modal").showModal("Añadir registro");
				$("#form").only("submit", (ev) => addSubmitHandler(ev));
			},
		},
		{
			text: "Exportar visibles a excel",
			className: "btn  mt-3 btn-export-visibles",
			action: () => {
				const data = table.rows({ page: "current" }).data();
				const parsedData = [];
				for (let iterator = 0; iterator < data.length; iterator++) {
					parsedData.push(data[iterator]);
				}
				toExcel(parsedData).then((res) => {
					download(
						new Blob([Buffer.from(res.data["data"], "hex")]),
						`exported-${Date.now()}.xlsx`
					);
				});
			},
		},
		{
			text: "Exportar tabla a excel",
			className: "btn mt-3 text-light btn-export-all",
			action: () => {
				const data = table.rows().data().toArray();
				toExcel(data).then((res) => {
					download(
						new Blob([Buffer.from(res.data["data"], "hex")]),
						`exportedTable-${Date.now()}.xlsx`
					);
				});
			},
		},
	],
	//Las columnas de la tabla, utiliza la variable que se define en table.html
	columns: [
		{
			className: "dt-control",
			orderable: false,
			sortable: false,
			data: null,
			defaultContent: "",
		},
		...columns,
		{
			data: "id",
			title: "Acciones",
			render: buttonsRender,
			sortable: false,
			searchable: false,
		},
	],
});

table.on("init.dt", () => {
	//Cuando finaliza el renderizado de la tabla, adjunta el botón de añadir a la tabla
	if (add) {
		table
			.buttons()
			.container()
			.appendTo($(".col-sm-12:eq(0)", table.table().container()));
	}
});

table.on("draw.dt", () => {
	//Cada vez que la tabla se rerenderiza, añade los controladores correspondientes a los botones de añadir y eliminar
	$("[data-action=edit]").on("click", editHandler);
	$("[data-action=delete]").on("click", deleteHandler);
	feather.replace();
});

$("#form-modal")
	.find("#submit-form-btn")
	.on("click", (ev) => {
		$("#form").trigger("submit");
	});
//El controlador del botón editar

async function editHandler(event) {
	$("#form-modal").showModal("Editar registro");
	$("#form")[0].reset();
	$("#form select").val("").trigger("change");
	$("#form").only("submit", editSubmitHandler);
	const id = $(this).data("id");
	//Se le añade un data-id al formulario, para poder conectarse con el api
	$("#form").data("id", id);

	//Se hace un fetch de los datos del objeto que se quiere editar, luego se
	//le adjunta dichos datos al formulario, para facilitar la edición
	const res = await axiosInstance.get(target_view + id);
	console.log(res);
	const jsonData = res.data;

	for (key in jsonData) {
		//Cada input del formulario tiene un id con el formato id_{nombre del dato}
		//Lo que permite que se pueda hacer lo siguiente
		const input = $(`#id_${key}`);

		//Si el input existe se le incluye la información
		if (input) {
			input.val(jsonData[key]);
		}
	}
}
//El controlador del botón eliminar
async function deleteHandler(event) {
	const id = $(this).data("id");

	const result = await Swal.fire({
		title: "¿Eliminar el registro?",
		showCancelButton: true,
		confirmButtonText: "Eliminar",
		cancelButtonText: `Cancelar`,
		confirmButtonColor: "red",
	});

	if (result.isConfirmed) {
		if (target_view.includes("plaqueados")) {
			const row = table.row($(this).parents("tr"));
			const rowData = row.data();
			if (rowData.tramite) {
				const result = await Swal.fire({
					title:
						"El registro se encuentra actualmente en un tramite, ¿eliminar de todas formas?",
					showCancelButton: true,
					confirmButtonText: "Eliminar",
					cancelButtonText: `Cancelar`,
					confirmButtonColor: "red",
				});

				if (result.isDenied) return;
			}
		}

		const { status } = await axiosInstance.delete(target_view + id);
		//El codigo 204 es el que por general retorna luego de una eliminación
		if (status === 204) {
			Swal.fire({
				icon: "success",
				title: "Se elimino el registro con exito",
				showConfirmButton: false,
				timer: swalAlertTimer,
			});
			table.ajax.reload();
		} else {
			Swal.fire({
				icon: "error",
				text: "Error al eliminar el registro",
			});
		}
	}
}

function sanitizeForm(form) {
	const valid = $(form)[0].checkValidity();
	if (!valid) {
		//Si es invalido, se reporta al usuario cuales campos faltan y se termina la función con un return
		$(form)[0].reportValidity();
		return false;
	}

	return true;
}

function getSanitizedFormData(form) {
	const formData = new FormData(form);

	//Se crea un objeto con el formdata para poder acceder a las keys y a los valores más facilmente

	const formattedFormData = Object.fromEntries(formData);

	for (key in formattedFormData) {
		//Declarar los datos vacios como null ayuda al api a procesar más facilmente los datos
		if (formattedFormData[key] === "") {
			formattedFormData[key] = null;
		}
	}
	return formattedFormData;
}
//El controlador del formulario de edición
async function addSubmitHandler(event) {
	event.preventDefault();
	//Se checa la validez del formulario
	if (!sanitizeForm(event.target)) return;
	//Si es valido, crea un formData con los datos del formulario: https://developer.mozilla.org/es/docs/Web/API/FormData
	const formData = getSanitizedFormData(event.target);
	//Se crea un texto json con los datos del formulario, luego se le adjuntan a la petición AJAX
	const res = await axios.post(target_view, formData, {
		headers: { "X-CSRFToken": getCsrf() },
	});
	//201: Objeto creado
	//400: El usuario ingreso mal un dato
	//500+: Algo pasó en el servidor
	if (res.status === 201) {
		Swal.fire({
			icon: "success",
			title: "Se añadió el activo con exito",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});

		const addModal = bootstrap.Modal.getInstance($("#form-modal"));
		addModal.hide();
		table.ajax.reload();
	} else if (res.status === 400) {
		Swal.fire({
			icon: "error",
			title: "Hay errores en los datos ingresados",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});
	} else if (res.status > 500) {
		Swal.fire({
			icon: "error",
			title: "Error con el servidor",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});
	}
}

//El controlador del formulario de edición
async function editSubmitHandler(event) {
	event.preventDefault();

	//Se checa la validez del formulario

	if (!sanitizeForm(event.target)) return;

	const id = $(event.target).data("id");
	//Si es valido, crea un formData con los datos del formulario: https://developer.mozilla.org/es/docs/Web/API/FormData
	const formData = getSanitizedFormData(event.target);

	//Se crea un texto json con los datos del formulario, luego se le adjuntan a la petición AJAX

	const res = await axiosInstance.put(target_view + id, formData);
	//200: Edición exitosa
	//400: El usuario ingreso mal un dato
	//500+: Algo pasó en el servidor
	if (res.status === 200) {
		Swal.fire({
			icon: "success",
			title: "Se editó el activo con exito",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});

		bootstrap.Modal.getInstance($("#form-modal")).hide();
		table.ajax.reload();
	} else if (res.status === 400) {
		Swal.fire({
			icon: "error",
			title: "Hay errores en los datos ingresados",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});
	} else if (res.status > 500) {
		Swal.fire({
			icon: "error",
			title: "Error con el servidor",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});
	}
}

//Esta función renderiza los botones una vez que la tabla terminó de renderizarse
function buttonsRender(data) {
	//data corresponde al id de cada activo, se utiliza para referirse a las rutas en el api
	return `
        <div class="container d-inline-flex gap-1">
        <button type="button"  data-action="edit" data-id=${data}><i data-feather="edit"></i></button>
        <button type="button" data-action="delete" data-id=${data}><i data-feather="x-circle"></i></button>
        </div>
    `;
}
//Se le añade el controlador al formulario, así como al botón para subir el formulario

function format(data) {
	let rows = [];
	console.log(data, "data");
	console.log(columns, "colums");
	for (item in data) {
		rows.push(
			`<tr class="detail-row"><td class="detail-title">${item}</td> <td class="detail-data">${data[item]}</td></tr>`
		);
	}

	return `<table cellpadding="5" cellspacing="0" border="0"class="detail-table">${rows.join(
		""
	)}</table>`;
}
$("#datatable tbody").on("click", "td.dt-control", function () {
	const selector = $(this).closest("tr");

	const row = table.row(selector);

	if (row.child.isShown()) {
		row.child.hide();
		selector.remove("shown");
	} else {
		row.child(format(row.data())).show();
		selector.addClass("shown");
	}
});
