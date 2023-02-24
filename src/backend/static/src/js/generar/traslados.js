import {
	getCsrf,
	Warning,
	Success,
	Err,
	toPdf,
	axiosInstance,
	PLAQUEADO,
	NO_PLAQUEADO,
} from "../utils";

import Swal from "sweetalert2";
// Se obtiene el cross-site request forgery token

const table = $("#activos-table").DataTable();

$("[data-action=pdf]").on("click", () => {
	table.column("controles:name").visible(false);
	const pdfContainer = $(".pdf-container").clone();
	pdfContainer.addClass("export");
	const motivoTextArea = pdfContainer.find("#id_motivo");
	const text = motivoTextArea.val();
	const motivoPdf = pdfContainer.find("#motivo_for_pdf");
	console.log(motivoPdf);
	const scrollHeight = $("#id_motivo").prop("scrollHeight");
	const finalHeight =
		scrollHeight == 0 ? $("#id_motivo").height() : scrollHeight;
	motivoTextArea.hide();
	motivoPdf.text(text);

	motivoPdf.height(finalHeight);
	motivoPdf.addClass("show");

	const worker = toPdf(
		pdfContainer[0],
		`Traslado-${new Date().toISOString()}.pdf`
	);
	worker.then(() => {
		table.column("controles:name").visible(true);
	});
});

$("[data-action=load]").on("click", async () => {
	const id = $("#id_tramite").select2("data")[0].id;
	if (!id) return;
	let res = await axiosInstance.get(tramitesView + id);

	tramite = await res.data;

	const {
		id: tramiteId,
		detalles,
		fecha,
		recipiente,
		referencia,
		remitente,
		activos_plaqueados,
		activos_no_plaqueados,
	} = tramite;

	$("#id_consecutivo").val(referencia);
	$("#id_fecha").val(fecha);
	$("#id_recipiente").val(recipiente).trigger("change");

	$("#id_remitente").val(remitente).trigger("change");
	$("#id_motivo").val(detalles);

	const trasladosRes = await axiosInstance.get(trasladosView, {
		params: {
			tramite: tramiteId,
		},
	});
	const traslados = trasladosRes.data;
	if (table.data().count()) {
		table.rows({ page: "current" }).remove();
	}

	for (let activo of activos_plaqueados) {
		let res = await axiosInstance.get(plaqueadosView, {
			params: {
				placa: activo,
			},
		});

		let db_activo = res.data[0];
		db_activo["tipo"] = PLAQUEADO;
		db_activo["rowId"] = db_activo.placa;
		table.row.add(db_activo);
	}

	for (let no_plaqueado of activos_no_plaqueados) {
		let res = await axiosInstance.get(noPlaqueadosView, {
			params: {
				serie: no_plaqueado,
			},
		});
		let db_no_plaqueado = res.data[0];
		db_no_plaqueado["placa"] = "Sin placa";
		db_no_plaqueado["tipo"] = NO_PLAQUEADO;
		db_no_plaqueado["rowId"] = db_no_plaqueado.serie;
		table.row.add(db_no_plaqueado);
	}
	table.draw();
	table
		.rows()
		.data()
		.toArray()
		.forEach((activo) => {
			let traslado = traslados.find((traslado) =>
				traslado.detalle.includes(activo.rowId)
			);
			$(`#${activo.rowId}`)
				.find("select")
				.select2("val", `${traslado.destino}`);
		});
});

$("[data-action=subir-traslado]").on("click", subirTrasladoHandler);

async function subirTrasladoHandler(event) {
	event.preventDefault();
	const referencia = $("#id_consecutivo").val();
	const fecha = $("#id_fecha").val();
	const remitente = $("#id_remitente").select2("data")[0].id;
	const recipiente = $("#id_recipiente").select2("data")[0].id;
	const detalles = $("#id_motivo").val();
	const activos = table.rows().data().toArray();

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
	const activosPlaqueados = activos
		.filter((activo) => activo.tipo === PLAQUEADO)
		.map((activo) => activo.id);
	const activosNoPlaqueados = activos
		.filter((activo) => activo.tipo === NO_PLAQUEADO)
		.map((activo) => activo.id);

	let traslados = activos.map((activo, idx) => {
		const tipo = activo.tipo === PLAQUEADO ? "PLAQUEADO" : "NO_PLAQUEADO";
		return {
			activo: activo.id,
			tipo,
			destino: destinos[idx],
		};
	});
	body["activosPlaqueados"] = activosPlaqueados;
	body["activosNoPlaqueados"] = activosNoPlaqueados;

	body["traslados"] = traslados;
	Swal.fire("Cargando solicitud");
	Swal.showLoading();
	const tramiteResponse = await axiosInstance
		.post(tramitesView, body)
		.catch((error) => {
			if (error.request.status >= 300 && error.request.status < 500) {
				Warning.fire({
					text: "Error al añadir tramite",
					footer: error.request.response,
				});
			} else if (error.request.status >= 500) {
				Err.fire("Parece que hubo un error en el servidor");
			}
		});
	Swal.hideLoading();
	const tramiteStatus = tramiteResponse.status;
	if (tramiteStatus > 200 && tramiteStatus < 300) {
		Success.fire("Se realizó el tramite con exito");
	}
}
