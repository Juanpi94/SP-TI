import Swal from "sweetalert2";
import { axiosInstance, Err, NO_PLAQUEADO, PLAQUEADO } from "../utils";

const table = $("#activos-table").DataTable({
	dom: "t",
	pageLength: 100,
	language: {
		emptyTable: "Aún no hay datos para esta tabla",
	},
	rowId: "rowId",
	columns: [
		{
			data: "id",
			render: idRenderer,
			sortable: false,
			searchable: false,
			visible: false,
		},
		{ data: "tipo", visible: false, sortable: false, searchable: false },
		{ data: "placa", title: "Placa" },
		{ data: "marca", title: "Marca" },
		{ data: "modelo", title: "Modelo" },
		{ data: "serie", title: "Serie" },
		{ data: "ubicacion", title: "Ubicación Actual", name: "ubicacion" },
		{
			data: "destino",
			title: "Destino",
			render: destinoRender,
			name: "destino",
		},
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
	if (table.column("destino:name").visible() == false) {
		return "";
	}
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
	if (data.tramites.length > 0) {
		const confirmacion = await Swal.fire({
			title:
				"Este activo ya tiene un tramite en curso, ¿añadir de todas formas?",
			showCancelButton: true,
			confirmButtonText: "Añadir",
			cancelButtonText: `Cancelar`,
		});
		if (!confirmacion.isConfirmed) return;
	}

	data["tipo"] = PLAQUEADO;
	table.row.add(data).draw();
});

$("[data-action=add_serie]").on("click", async () => {
	const id = $("#id_serie").select2("data")[0].id;
	const response = await axiosInstance.get(noPlaqueadosView + id);
	console.log(response);
	const data = response.data;
	data["placa"] = "Sin placa";
	data["tipo"] = NO_PLAQUEADO;
	const repeated = table
		.rows()
		.data()
		.toArray()
		.some((activo) => activo.serie == data.serie);
	if (repeated) {
		Err.fire("Activo no plaqueado ya ha sido añadido");
		return;
	}
	if (data.tramites.length > 0) {
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

//Action listeners para los botones de margen
$("[data-action=add").on("click", (ev) => {
	const target = $(ev.target).attr("data-target");
	const element = $(`[data-spacing=${target}]`);
	console.log(target, element);
	const spacing = parseFloat(element.css("--spacing"));
	const newSpacing = spacing + 2;
	element.css("--spacing", newSpacing + "rem");
});

$("[data-action=substract]").on("click", (ev) => {
	const target = $(ev.target).attr("data-target");
	const element = $(`[data-spacing=${target}]`);

	const spacing = parseFloat(element.css("--spacing"));
	const newSpacing = Math.max(0, spacing - 2);
	element.css("--spacing", newSpacing + "rem");
});
