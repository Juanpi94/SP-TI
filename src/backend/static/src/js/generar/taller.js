import {
	axiosInstance,
	Err,
	NO_PLAQUEADO,
	PLAQUEADO,
	Success,
	Warning,
} from "../utils";

const table = $("#activos-table").DataTable();
table.column("destino:name").visible(false);
table.column("ubicacion:name").visible(false);

$("[data-action=subir-taller]").on("click", async () => {
	const boleta = $("#id_boleta").val();
	const fecha = $("#id_fecha").val();
	const destinatario = $("#destinatario-input").val();
	const beneficiario = $("#beneficiario-input").val();
	const motivo = $("#id_motivo").val();
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
	};
	for (let field in testBody) {
		if (!testBody[field]) {
			Err.fire(`El campo ${field} está vacio`);
			return;
		}
	}

	if (activos.length == 0) {
		Err.fire("Por favor añada activos");
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
