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
			templateSelection: function (data) {
				if (data.id == "") {
					return "seleccione una opción";
				}
				return data.text;
			},
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
					// this.dropdown._positionDropdown();
				}
			});
	}

	// Esta función se encarga de inicializar la tabla
	let table = $("#datatable").DataTable({
		scrollX: true,
		rowId: (data) => {
			return data[Object.keys(data)[0]];
		},
		ajax: { url: target_view, dataSrc: "" },
		buttons: {
			buttons: [
				{
					extend: "print",
					text: "Imprimir",
					className: "btn mt-3 btn-print",
					exportOptions: {
						columns: [":not(.not-exportable)"],
					},
				},
				{
					text: "Añadir",
					className: "btn mt-3 btn-add",
					enabled: add,
					action: () => {
						if (!add) {
							return;
						}
						$("#form")[0].reset();
						$("#form select").val("").trigger("change");
						$("#form-modal").showModal("Añadir registro");
						$("#form").only("submit", (ev) => addSubmitHandler(ev));
					},
				},
				{
					extend: "pdf",
				},
				{
					extend: "excel",
					text: "Exportar visibles a excel",
					className: "btn mt-3 btn-export-visibles",
					title: `${
						document.title
					}-visibles-${new Date().toLocaleTimeString()}`,
					exportOptions: {
						columns: [":not(.not-exportable)"],
						modifier: {
							page: "current",
						},
					},
				},
				{
					extend: "excel",
					text: "Exportar tabla a excel",
					className: "btn mt-3 btn-export-all",
					title: `${document.title}-${new Date().toLocaleTimeString()}`,
					exportOptions: {
						columns: [":not(.not-exportable)"],
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
							let exitos = 0;
							let rows = table.rows(".selected");
							for (let rowIdx of rows) {
								let row = table.row(rowIdx);

								const { status } = await axiosInstance.delete(
									target_view + row.id()
								);

								row.remove().draw();
								if (status >= 200 && status <= 205) {
									exitos += 1;
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
						const rows = table.rows(".selected").nodes().to$();
						rows.removeClass("selected");
						rows.find("input[type=checkbox]").check(false);
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
				className: "select-column not-exportable",
				sortable: false,
				searchable: false,
			},
			...columns,
			{
				data: "id",
				title: "Acciones",
				className: "not-exportable",
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
	$("thead .select-column").on("click", () => {
		if ($(".selected").length) return;
		const rows = table.rows(".selected").nodes().to$();
		rows.toggleClass("selected");
		rows.find("input[type=checkbox]").check(true);
		table.button("delete-all:name").enable();
		table.button("deselect:name").enable();
	});
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

		const jsonData = table.row(`#${id}`).data();

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
				console.log(rowData);
				if (rowData.tramites.length > 0) {
					const result = await Swal.fire({
						title:
							"El registro se encuentra actualmente en un tramite, ¿eliminar de todas formas?",
						showCancelButton: true,
						confirmButtonText: "Eliminar",
						cancelButtonText: `Cancelar`,
						confirmButtonColor: "red",
					});

					if (result.isDenied || result.isDismissed) return;
				}
			}

			const errorHandler = (error) => {
				if (error.request.status >= 300 && error.request.status < 500) {
					Warning.fire({
						text: "Error al eliminar el registro",
						footer: error.request.response,
					});
				} else if (error.request.status >= 500) {
					Err.fire("Parece que hubo un error en el servidor");
				}
				return error.request;
			};
			Swal.fire("Cargando solicitud");
			Swal.showLoading();
			const { status } = await axiosInstance
				.delete(target_view + id)
				.catch(errorHandler);
			Swal.hideLoading();
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

		const rawFormData = Object.fromEntries(formData);
		const formattedFormData = {};
		for (key in rawFormData) {
			//Declarar los datos vacios como null ayuda al api a procesar más facilmente los datos
			if (rawFormData[key] !== "") {
				formattedFormData[key] = rawFormData[key];
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

		const errorHandler = (error) => {
			if (error.request.status >= 300 && error.request.status < 500) {
				Warning.fire({
					text: "Error al añadir el registro",
					footer: error.request.response,
				});
			} else if (error.request.status >= 500) {
				Err.fire("Parece que hubo un error en el servidor");
			}

			return error.request;
		};
		//Se crea un texto json con los datos del formulario, luego se le adjuntan a la petición AJAX
		//201: Objeto creado
		//400: El usuario ingreso mal un dato
		//500+: Algo pasó en el servidor

		Swal.fire("Cargando solicitud");
		Swal.showLoading();
		const res = await axios
			.post(target_view, formData, {
				headers: { "X-CSRFToken": getCsrf() },
			})
			.catch(errorHandler);
		Swal.hideLoading();
		if (res.status > 200 && res.status <= 205) {
			Swal.fire({
				icon: "success",
				title: "Se añadió el registro con exito",
				showConfirmButton: false,
				timer: swalAlertTimer,
			});

			table.row.add(res.data).draw();
			const addModal = bootstrap.Modal.getInstance($("#form-modal"));
			addModal.hide();
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
			return error.request;
		};

		Swal.fire("Cargando solicitud");
		Swal.showLoading();
		const res = await axiosInstance
			.put(target_view + id, formData)
			.catch(errorHandler);
		Swal.hideLoading();
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
