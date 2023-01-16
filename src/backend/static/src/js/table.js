import {
	axiosInstance,
	download,
	Err,
	getCsrf,
	Success,
	toExcel,
	Warning,
} from "./utils";
import Swal from "sweetalert2";

import { Buffer } from "buffer";
import axios from "axios";

$(document).on("DOMContentLoaded", main);

function main() {
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
		scrollX: true,
		rowId: "id",
		ajax: { url: target_view, dataSrc: "" },
		buttons: {
			buttons: [
				{
					text: "Añadir",
					className: "btn mt-3 btn-add",
					enabled: add,
					action: () => {
						if (!add) {
							return;
						}
						$("#form")[0].reset();
						$("#form-modal").showModal("Añadir registro");
						$("#form").only("submit", (ev) => addSubmitHandler(ev));
					},
				},
				{
					text: "Exportar visibles a excel",
					className: "btn  mt-3 btn-export-visibles",
					action: () => {
						const data = table.rows({ page: "current" }).data().toArray();

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
					className: "btn mt-3 btn-export-all",
					action: () => {
						const data = table.rows().data().toArray();
						console.log(data);
						toExcel(data).then((res) => {
							download(
								new Blob([Buffer.from(res.data["data"], "hex")]),
								`exportedTable-${Date.now()}.xlsx`
							);
						});
					},
				},

				{
					text: "Eliminar seleccionados",
					className: "btn mt-3 btn-delete-all",
					enabled: false,
					name: "delete-all",
					action: async () => {
						const result = await Swal.fire({
							title: "¿Eliminar todos estos registros?",
							showCancelButton: true,
							confirmButtonText: "Eliminar",
							cancelButtonText: `Cancelar`,
							confirmButtonColor: "red",
						});

						if (result.isConfirmed) {
							const rows = table.rows(".selected").data().toArray();
							let exitos = 0;
							for (let row of rows) {
								const { status } = await axiosInstance.delete(
									target_view + row.id
								);

								table.row(`#${row.id}`).remove().draw();
								if (status >= 200 && status <= 205) {
									exitos++;
								}
							}
							table.draw();
							table.button("delete-all:name").disable();
							table.button("deselect:name").disable();
							Success.fire(
								`Se eliminaron ${exitos} de ${rows.length} registros`
							);
						}
					},
				},

				{
					text: "Deseleccionar todos",
					className: "btn mt-3 btn-deselect",
					enabled: false,
					name: "deselect",
					action: () => {
						$(".selected").removeClass("selected");

						$("[name=select-checkbox]").check(false);
						table.button("delete-all:name").disable();
						table.button("deselect:name").disable();
					},
				},
			],
		},
		//Las columnas de la tabla, utiliza la variable que se define en table.html
		columns: [
			{
				data: null,
				title: "Seleccionar",
				render: selectRender,
				className: "select-column",
				sortable: false,
				searchable: false,
			},
			...columns,
			{
				data: "id",
				title: "Acciones",
				render: buttonsRender,
				sortable: false,
				searchable: false,
				visible: edit,
			},
		],
	});

	table.on("init.dt", () => {
		//Cuando finaliza el renderizado de la tabla, adjunta el botón de añadir a la tabla

		table
			.buttons()
			.container()
			.appendTo($(".col-sm-12:eq(0)", table.table().container()));
	});

	$("#datatable").on("click", "[data-action=edit]", editHandler);
	$("#datatable").on("click", "[data-action=delete]", deleteHandler);
	$("#datatable").on("click", "[data-action=show]", showDetailsHandler);

	table.on("draw.dt", feather.replace);

	$("#form-modal")
		.find("#submit-form-btn")
		.on("click", (ev) => {
			$("#form").trigger("submit");
		});
	//El controlador del botón editar

	async function editHandler(event) {
		event.stopPropagation();
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

		const jsonData = res.data;
		console.log(jsonData);
		for (key in jsonData) {
			//Cada input del formulario tiene un id con el formato id_{nombre del dato}
			//Lo que permite que se pueda hacer lo siguiente
			const input = $(`#id_${key}`);

			//Si el input existe se le incluye la información
			if (input) {
				input.val(jsonData[key]);
				input.trigger("change");
			}
		}
	}
	//El controlador del botón eliminar
	async function deleteHandler(event) {
		event.stopPropagation();
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
				table.row(`#${id}`).remove().draw();
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

		console.log(res);
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

			console.log("añadir", res.data);
			table.row.add(res.data).draw();
			const addModal = bootstrap.Modal.getInstance($("#form-modal"));
			addModal.hide();
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
		//200: Edición exitosa
		//400: El usuario ingreso mal un dato
		//500+: Algo pasó en el servidor
		const errorHandler = (error) => {
			if (error.request.status >= 300 && error.request.status < 500) {
				Warning.fire({
					text: "Error al editar el registro",
					footer: error.request.response,
				});
			} else if (error.request.status >= 500) {
				Err.fire("Parece que hubo un error en el servidor");
			}
		};
		const res = await axiosInstance
			.put(target_view + id, formData)
			.catch(errorHandler);

		if (res.status === 200) {
			Swal.fire({
				icon: "success",
				title: "Se editó el activo con exito",
				showConfirmButton: false,
				timer: swalAlertTimer,
			});

			bootstrap.Modal.getInstance($("#form-modal")).hide();
			table.row("#" + res.data.id).data(res.data);
			table.draw();
		}
	}

	let detailsModal = new bootstrap.Modal(
		document.getElementById("detail-modal", {})
	);
	//El controlador para ver los detalles de cada registro
	function showDetailsHandler(event) {
		event.stopPropagation();
		const id = $(this).data("id");

		const data = table.row("#" + id).data();
		const modalBody = $("#detail-modal").find(".modal-body");
		modalBody.children(".detail-row").remove();
		const template = $("#detail-template");

		for (let title in data) {
			if (!data[title]) continue;
			const detailsRow = template.contents().clone();
			const detailsTitle = detailsRow.find(".detail-title");
			const info = detailsRow.find(".detail-info");
			let formmated_title =
				title.charAt(0).toUpperCase() +
				title.slice(1).replaceAll("_", " ") +
				":";
			detailsTitle.text(formmated_title);
			info.text(data[title]);
			modalBody.append(detailsRow);
		}

		detailsModal.show();
	}

	function selectHandler() {
		$(this).parent("td").parent("tr").toggleClass("selected");
		if ($(".selected").length > 0) {
			table.button("delete-all:name").enable();
			table.button("deselect:name").enable();
		} else {
			table.button("delete-all:name").disable();
			table.button("deselect:name").disable();
		}
	}

	$("#datatable").on("click", "input[type=checkbox]", selectHandler);
	//Esta función renderliza los checkboxes para seleccionar
	function selectRender() {
		return `<input name="select-checkbox" type="checkbox"/>`;
	}
	//Esta función renderiza los botones una vez que la tabla terminó de renderizarse
	function buttonsRender(data) {
		//data corresponde al id de cada activo, se utiliza para referirse a las rutas en el api
		return `
        <div class="container d-inline-flex gap-1">
        <button type="button"  data-action="edit" data-id=${data}><i data-feather="edit"></i></button>
        <button type="button" data-action="delete" data-id=${data}><i data-feather="x-circle"></i></button>
		<button type="button" data-action="show" data-id=${data}><i data-feather="eye"></i></button>
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
}
