//Este archivo utiliza variables que se declaran en table.html

const swalAlertTimer = 1200; //El tiempo en que las alertas de sweetAlert tardan en estar visibles: https://sweetalert2.github.io/


//Token para validar los requests
csrfToken = getCsrf()


//Se obtiene un fetcher desde utils.js
const fetcher = new Fetcher(target_view, csrfToken).getFetcher()
// Esta función se encarga de inicializar la tabla
let table = $("#datatable").DataTable({
	ajax: { url: target_view, dataSrc: ""},
	language: {
		emptyTable: "Aún no hay datos para esta tabla",
		zeroRecords: "No hay resultados para esta busqueda",
	},
	buttons: [
		{
			text: "Add",
			action: () => {
				$("#add-modal").modal("show");
			},
		},
	],
	//Las columnas de la tabla, utiliza la variable que se define en table.html
	columns: [
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
});


//El controlador del botón editar
async function editHandler(event) {
	const id = $(this).data("id");
	//Se le añade un data-id al formulario, para poder conectarse con el api
	$("#edit-form").data("id", id);

	//Se hace un fetch de los datos del objeto que se quiere editar, luego se
	//le adjunta dichos datos al formulario, para facilitar la edición
	const data = await fetcher({url: id + "/"})
	const jsonData = await data.json()

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
	})

	if (result.isConfirmed) {
		const {status} = await fetcher({url: id + "/", method: "DELETE"})
		//El codigo 204 es el que por general retorna luego de una eliminación
		if (status === 204) {
			swal.fire({
				icon: "success",
				title: "Se elimino el registro con exito",
				showConfirmButton: false,
				timer: swalAlertTimer,
			});
			table.ajax.reload();
		} else {
			swal.fire({
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
	const body = JSON.stringify(formData);

	const res = await fetcher({body, method:"POST"})
	//201: Objeto creado
	//400: El usuario ingreso mal un dato
	//500+: Algo pasó en el servidor
	if (res.status === 201) {
		swal.fire({
			icon: "success",
			title: "Se añadió el activo con exito",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});

		$("#add-modal").modal("hide");
		table.ajax.reload();
	} else if (res.status === 400) {
		swal.fire({
			icon: "error",
			title: "Hay errores en los datos ingresados",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});
	} else if (res.status > 500) {
		swal.fire({
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
	const id = $(this).data("id");
	//Si es valido, crea un formData con los datos del formulario: https://developer.mozilla.org/es/docs/Web/API/FormData
	const formData = getSanitizedFormData(event.target);

	//Se crea un texto json con los datos del formulario, luego se le adjuntan a la petición AJAX
	const body = JSON.stringify(formData);

	const res = await fetcher({url: id + "/", body, method: "PUT"})
	//200: Edición exitosa
	//400: El usuario ingreso mal un dato
	//500+: Algo pasó en el servidor
	if (res.status === 200) {
		swal.fire({
			icon: "success",
			title: "Se editó el activo con exito",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});

		$("#edit-modal").modal("hide");
		table.ajax.reload();
	} else if (res.status === 400) {
		swal.fire({
			icon: "error",
			title: "Hay errores en los datos ingresados",
			showConfirmButton: false,
			timer: swalAlertTimer,
		});
	} else if (res.status > 500) {
		swal.fire({
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
        <button type="button" data-bs-toggle="modal" data-bs-target="#edit-modal" data-action="edit" data-id=${data}>Edit</button>
        <button type="button" data-action="delete" data-id=${data}>Delete</button>
        </div>
    `;
}
//Se le añade el controlador al formulario, así como al botón para subir el formulario

const editForm = $("#edit-form");
editForm.on("submit", editSubmitHandler);

$("#edit-modal")
	.find("#submit-form-btn")
	.on("click", () => {
		editForm.submit();
	});

const addForm = $("#add-form");
addForm.on("submit", addSubmitHandler);
$("#add-modal")
	.find("#submit-form-btn")
	.on("click", () => {
		addForm.submit();
	});
