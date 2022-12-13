import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import { axiosInstance, Err } from "../utils";
const table = $("#activos-table").DataTable({
	dom: "t",
	pageLength: 100,
	language: {
		emptyTable: "Aún no hay datos para esta tabla",
	},
	rowId: "id",
	columns: [
		{ data: "id", render: idRenderer, sortable: false },
		{ data: "placa", title: "Placa" },
		{ data: "marca", title: "Marca" },
		{ data: "modelo", title: "Modelo" },
		{ data: "serie", title: "Serie" },
		{ data: "ubicacion", title: "Ubicación Actual" },
		{ data: "destino", title: "Destino", render: destinoRender },
		{
			data: null,
			title: "controles",
			render: controlesRender,
			name: "controles",
		},
	],
});

// Se inicializa los select2
$("select").select2({
	language: {
		noResults: () => "No hay resultados para esta busqueda",
	},
	theme: "default",
});

$(".select2-container").addClass("col");

function idRenderer(id, type, row) {
	const idType = row["placa"] !== "" ? "plaqueado" : "no_plaqueado";
	return `<input name="id-input" type='hidden' value="${id}" data-type="${idType}"/>`;
}
function controlesRender() {
	return "<button data-action='delete-row' class='traslados-control' title='control'> <i data-feather='x-circle'></i></button>";
}

function destinoRender() {
	return destinoSelect;
}

table.on("draw.dt", () => {
	$("[data-action=delete-row]").on("click", deleteRowHandler);
	$(".destino-select").removeAttr("id");
	$(".destino-select").select2();

	feather.replace();
});

function deleteRowHandler(event) {
	table.row($(this).parents("tr")).remove().draw();
}

$("[data-action=add_placa]").on("click", async () => {
	const id = $("#id_placa").select2("data")[0].id;
	alert("Im firing");
	const repeated = table
		.rows()
		.data()
		.toArray()
		.some((activo) => {
			return activo.id == id;
		});

	if (repeated) {
		Err.fire("Este activo ya se agrego una vez");
		return;
	}

	const response = await axiosInstance.get(plaqueadosView + id);
	const data = await response.data;
	if (data.tramite) {
		const confirmacion = await Swal.fire({
			title:
				"Este activo ya tiene un tramite en curso, ¿añadir de todas formas?",
			showCancelButton: true,
			confirmButtonText: "Añadir",
			cancelButtonText: `Cancelar`,
		});
		if (!confirmacion.isConfirmed) return;
	}
	table.row.add(data).draw();
	console.log("added");
});

$("[data-action=add_serie]").on("click", async () => {
	const id = $("#id_serie").select2("data")[0].id;
	const response = await axiosInstance.get(noPlaqueadosView + id);
	console.log(response);
	const data = response.data;
	data["placa"] = "";
	const repeated = table
		.rows()
		.data()
		.toArray()
		.some((activo) => (activo.serie = data.serie));
	if (repeated) {
		Err.fire("Activo no plaqueado ya ha sido añadido");
		return;
	}
	if (data.tramite == null) {
		const confirmacion = await Swal.fire({
			title:
				"Este activo ya tiene un tramite en curso, ¿añadir de todas formas?",
			showCancelButton: true,
			confirmButtonText: "Añadir",
			cancelButtonText: `Cancelar`,
		});
		if (!confirmacion.isConfirmed) return;
	}
	table.row.add(data).draw();
});
