import { getCsrf, Warning, Success, Err, toPdf, axiosInstance } from "../utils";

import Swal from "sweetalert2";
// Se obtiene el cross-site request forgery token

const table = $("#activos-table").DataTable();
// // Se inicializa la tabla de activos
// const table = $("#activos-table").DataTable({
// 	dom: "t",
// 	pageLength: 100,
// 	language: {
// 		emptyTable: "Aún no hay datos para esta tabla",
// 	},
// 	rowId: "id",
// 	columns: [
// 		{ data: "id", render: idRenderer, sortable: false },
// 		{ data: "placa", title: "Placa" },
// 		{ data: "marca", title: "Marca" },
// 		{ data: "modelo", title: "Modelo" },
// 		{ data: "serie", title: "Serie" },
// 		{ data: "ubicacion", title: "Ubicación Actual" },
// 		{ data: "destino", title: "Destino", render: destinoRender },
// 		{
// 			data: null,
// 			title: "controles",
// 			render: controlesRender,
// 			name: "controles",
// 		},
// 	],
// });

// // Se inicializa los select2
// $("select").select2({
// 	language: {
// 		noResults: () => "No hay resultados para esta busqueda",
// 	},
// 	theme: "default",
// });

// $(".select2-container").addClass("col");

// function idRenderer(id) {
// 	return `<input name="id-input" type='hidden' value="${id}"/>`;
// }
// function controlesRender() {
// 	return "<button data-action='delete-row' class='traslados-control' title='control'> <i data-feather='x-circle'></i></button>";
// }

// function destinoRender() {
// 	return destinoSelect;
// }

// table.on("draw.dt", () => {
// 	$("[data-action=delete-row]").on("click", deleteRowHandler);
// 	$(".destino-select").removeAttr("id");
// 	$(".destino-select").select2();

// 	feather.replace();
// });



$("[data-action=pdf]").on("click", () => {
	$(".pdf-container").toggleClass("export");
	table.column("controles:name").visible(false);
	const motivoTextArea = $("#id_motivo");
	const text = motivoTextArea.val();
	const motivoPdf = $("#motivo_for_pdf");
	const scrollHeight = motivoTextArea.prop("scrollHeight");
	const finalHeight =
		scrollHeight == 0 ? motivoTextArea.height() : scrollHeight;
	motivoTextArea.hide();
	motivoPdf.text(text);
	motivoPdf.height(finalHeight);
	motivoPdf.show();
	// const opts = {
	// 	html2canvas: { scale: 3 },
	// 	margin: [40, 0, 22, 0],
	// 	jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
	// 	pagebreak: {
	// 		avoid: "tr",
	// 		mode: ["avoid-all", "css", "legacy"],
	// 	},
	// };

	const worker = toPdf(
		$(".pdf-container")[0],
		`Traslado-${new Date().toISOString()}.pdf`
	);
	worker.then(() => {
		$(".pdf-container").toggleClass("export");
		table.column("controles:name").visible(true);
		motivoPdf.text("");
		motivoPdf.hide();
		motivoTextArea.show();
	});
});

// $("[data-action=add_placa]").on("click", async () => {
// 	const id = $("#id_placa").select2("data")[0].id;

// 	const repeated = table
// 		.rows()
// 		.data()
// 		.toArray()
// 		.some((activo) => {
// 			return activo.id == id;
// 		});

// 	if (repeated) {
// 		Err.fire("Este activo ya se agrego una vez");
// 		return;
// 	}

// 	const response = await axiosInstance.get(plaqueadosView + id);
// 	const data = response.data;
// 	if (data.tramite) {
// 		const confirmacion = await Swal.fire({
// 			title:
// 				"Este activo ya tiene un tramite en curso, ¿añadir de todas formas?",
// 			showCancelButton: true,
// 			confirmButtonText: "Añadir",
// 			cancelButtonText: `Cancelar`,
// 		});
// 		if (!confirmacion.isConfirmed) return;
// 	}
// 	table.row.add(data).draw();
// 	console.log("added");
// });

$("[data-action=load]").on("click", async () => {
	const id = $("#id_tramite").select2("data")[0].id;
	if (!id) return;
	let res = await axiosInstance.get(tramitesView + id);

	tramite = await res.data;

	/* 
    detalles: "adsadsd"
    estado: "Pendiente"
    fecha: "2022-05-03"
    id: 4
    recipiente: 1
    referencia: "ValidacionesTest-SP"
    remitente: 2
    solicitante: 1
    tipo: "Traslado"
    urgencia: "H"
    */
	const {
		id: tramiteId,
		detalles,
		fecha,
		recipiente,
		referencia,
		remitente,
		activos,
	} = tramite;

	$("#id_consecutivo").val(referencia);
	$("#id_fecha").val(fecha);
	$("#id_recipiente").val(recipiente).trigger("change");

	$("#id_remitente").val(remitente).trigger("change");
	$("#id_motivo").val(detalles);

	if (table.data().count()) {
		table.rows({ page: "current" }).remove();
	}

	for (let activo of activos) {
		table.row.add(activo);
	}
	table.draw();

	let bodyDestinos = activos.map((activo) => activo.id);
	let responseDestinos = await axiosInstance.post(
		trasladosView + "get_destinos/",
		{
			activos: bodyDestinos,
		}
	);

	let traslados = responseDestinos.data;

	for (let traslado of traslados) {
		$(`#${traslado.activo}`)
			.find("select")
			.select2("val", `${traslado.destino}`);
	}
});

$("[data-action=subir-traslado]").on("click", subirTrasladoHandler);

async function subirTrasladoHandler(event) {
	event.preventDefault();
	const referencia = $("#id_consecutivo").val();
	const fecha = $("#id_fecha").val();
	const remitente = $("#id_remitente").select2("data")[0].id;
	const recipiente = $("#id_recipiente").select2("data")[0].id;
	const detalles = $("#id_motivo").val();
	const activos = $("[name=id-input]")
		.map((i, input) => $(input).val())
		.toArray();
	const destinos = $("[name=destino]")
		.map((i, input) => $(input).select2("data")[0].id)
		.toArray()
		.filter((id) => id);

	let body = {
		referencia,
		fecha,
		remitente,
		recipiente,
		detalles,
		solicitante: userId,
		activos,
	};

	for (let field in body) {
		if (!body[field]) {
			Err.fire(`El campo ${field.toUpperCase()} está vacio`);
			return;
		}
	}
	if (!activos || !activos.length) {
		Err.fire("No se agregaron activos");
		return;
	}
	console.log(destinos);
	if (!destinos || !destinos.length || activos.length !== destinos.length) {
		Err.fire(`Uno o más activos no tienen destino`);
		return;
	}

	const bodyTramites = JSON.stringify(body);
	let bodyTraslados = activos.map((activo, idx) => {
		return {
			activo,
			destino: destinos[idx],
		};
	});
	bodyTraslados = JSON.stringify(bodyTraslados);

	const tramiteResponse = await axiosInstance.post(tramitesView, bodyTramites);
	const trasladosResponse = await axiosInstance.post(
		trasladosView,
		bodyTraslados
	);

	const tramiteStatus = tramiteResponse.status;
	if (tramiteStatus > 200 && tramiteStatus < 300) {
		Success.fire("Se realizó el tramite con exito");
	} else if (tramiteStatus === 400) {
		const warningText = await tramiteResponse.text();

		Warning.fire({
			text: "Error con los datos ingresados",
			footer: warningText,
		});
	} else if (tramiteStatus > 500) {
		Err.fire("Hubo un problema con el servidor");
	}
}
