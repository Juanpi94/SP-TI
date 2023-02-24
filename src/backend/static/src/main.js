import "bootstrap/dist/css/bootstrap.css";
import "sweetalert2/src/sweetalert2.scss";
import "select2/dist/css/select2.min.css";
import "datatables.net-bs4/css/dataTables.bootstrap4.css";
import select2 from "select2";
import $ from "jquery";

import "datatables.net-bs4";
import "datatables.net-buttons";
import jsZip from "jszip";
import "datatables.net-buttons/js/buttons.print.min.mjs";

import buttonsHtml5 from "datatables.net-buttons/js/buttons.html5";

import * as bootstrap from "bootstrap";
import feather from "feather-icons";

buttonsHtml5(window, $);
window.JSZip = jsZip;
feather.icons["x-circle"].attrs = {
	...feather.icons["x-circle"].attrs,
	fill: "red",
	color: "white",
};

//Configuración predeterminada para todas las tablas de datatables, fundamentalmente las configuraciones de idioma
$.extend(true, $.fn.dataTable.defaults, {
	language: {
		emptyTable: "Aún no hay datos para esta tabla",
		zeroRecords: "No hay resultados para esta busqueda",
		pageLength: {
			"-1": "Mostrar todas las filas",
			_: "Mostrar %d filas",
		},
		paginate: {
			first: "Primero",
			last: "Último",
			next: "Siguiente",
			previous: "Anterior",
		},
		info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
		infoFiltered: "(filtrado de un total de _MAX_ registros)",
		searchPanes: {
			clearMessage: "Borrar todo",
			collapse: {
				0: "Paneles de búsqueda",
				_: "Paneles de búsqueda (%d)",
			},
			count: "{total}",
			countFiltered: "{shown} ({total})",
			emptyPanes: "Sin paneles de búsqueda",
			loadMessage: "Cargando paneles de búsqueda",
			title: "Filtros Activos - %d",
			showMessage: "Mostrar Todo",
			collapseMessage: "Colapsar Todo",
		},
	},
});

//Funciones de jquery realizadas propias
$.fn.extend({
	check: function (forceCheck) {
		if (this.attr("type") == "checkbox") {
			this.prop("checked", forceCheck);
		}
	},
	//Verifica si un input de un formulario es válido
	isValid: function () {
		return this[0].checkValidity();
	},
	//Establece como inválido un input de un formulario
	setInvalid: function (msg) {
		this[0].setCustomValidity(msg);
		this[0].reportValidity();
	},

	//Establece como válido un input de un formulario
	setValid: function () {
		this[0].setCustomValidity("");
		this[0].reportValidity();
	},

	//Muestra un modal de bootstrap
	showModal: function (labelText) {
		let modal = new bootstrap.Modal(this[0]);

		if (modal) {
			let label = $(this[0]).find("#modalLabel");
			if (label) {
				label.text(labelText);
			}
			modal.show();
		}
	},
	//Enlaza un evento a un elemento, eliminando el resto de manejadores
	only: function (event, handler) {
		$(this[0]).off();

		$(this[0]).on(event, (ev) => {
			handler(ev);
		});
	},
});

window.$ = $;

select2($);
window.bootstrap = bootstrap;
window.feather = feather;

if ($("[data-feather]").length > 0) {
	feather.replace();
}
