import {
	axiosInstance,
	Err,
	NO_PLAQUEADO,
	PLAQUEADO,
	Success,
	toPdf,
	Warning,
} from "../utils";

const table = $("#activos-table").DataTable();
table.column("destino:name").visible(false);
table.column("ubicacion:name").visible(false);

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
		`Envio_Taller-${new Date().toISOString()}.pdf`
	);

	worker.then(() => {
		table.column("controles:name").visible(true);
	});
});

$("[data-action=subir-taller]").on("click", async () => {
	const boleta = $("#id_boleta").val();
	const fecha = $("#id_fecha").val();
	const destinatario = $("#destinatario-input").val();
	const beneficiario = $("#beneficiario-input").val();
	const motivo = $("#id_motivo").val();
	const autor = $("#autor-input").val();
	const activos = table.rows().data().toArray();
	const activosPlaqueados = activos
		.filter((activo) => activo.tipo === PLAQUEADO)
		.map((activo) => activo.id);
	const activosNoPlaqueados = activos
		.filter((activo) => activo.tipo === NO_PLAQUEADO)
		.map((activo) => activo.id);

	const body = {
		referencia: boleta,
		taller: {
			destinatario,
			beneficiario,
			autor,
		},
		solicitante: userId,
		detalles: motivo,
		activosNoPlaqueados,
		activosPlaqueados,
		fecha,
		tipo: "Taller",
	};
	const testBody = {
		boleta,
		destinatario,
		beneficiario,
		detalles: motivo,
		fecha,
		autor,
	};
	for (let field in testBody) {
		if (!testBody[field]) {
			Err.fire(`El campo ${field} está vacio`);
			return;
		}
	}

	if (activos.length == 0) {
		Err.fire("Por favor añada activos");
		return;
	}

	const res = await axiosInstance.post(tramitesView, body).catch((error) => {
		if (error.request.status >= 300 && error.request.status < 500) {
			Warning.fire({
				text: "Error al añadir tramite",
				footer: error.request.response,
			});
		} else if (error.request.status >= 500) {
			Err.fire("Parece que hubo un error en el servidor");
		}
	});

	if (res.status > 200 && res.status <= 205) {
		Success.fire("El tramite " + boleta + " se añadió con exito");
	}
});
