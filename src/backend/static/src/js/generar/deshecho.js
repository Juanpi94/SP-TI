import Swal from "sweetalert2";
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

$("#fecha").on("click", () => {
	$("#fecha-input")[0].showPicker();
});

$("#fecha-input").on("change", (event) => {
	let date = new Date(event.target.value.replace("-", "/"));

	let year = new Intl.DateTimeFormat(undefined, { year: "numeric" }).format(
		date
	);
	let month = new Intl.DateTimeFormat(undefined, { month: "long" }).format(
		date
	);
	let day = new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(date);

	$("#fecha").text(
		`${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} del ${year}`
	);
});
$("[data-action=pdf]").on("click", () => {
	table.column("controles:name").visible(false);
	const pdfContainer = $(".pdf-container").clone();
	pdfContainer.addClass("export");
	const worker = toPdf(
		pdfContainer[0],
		`Deshecho-${new Date().toISOString()}.pdf`
	);

	worker.then(() => {
		table.column("controles:name").visible(true);
	});
});

$("[data-action=load]").on("click", async () => {
	const id = $("#id_deshechos").select2("val");

	if (!id) return;
	const { data } = await axiosInstance.get(tramitesView + id);
	$("#deshecho-title").text(data.referencia);
	let date = new Date(data.fecha.replace("-", "/"));

	let year = new Intl.DateTimeFormat("sp", { year: "numeric" }).format(date);
	let month = new Intl.DateTimeFormat("sp", { month: "long" }).format(date);
	let day = new Intl.DateTimeFormat("sp", { day: "2-digit" }).format(date);

	$("#fecha").text(`${day} de ${month} del ${year}`);

	for (let activoPlaqueado of data["activos_plaqueados"]) {
		let { data: dataActivo } = await axiosInstance.get(plaqueadosView, {
			params: {
				placa: activoPlaqueado,
			},
		});

		table.row.add(dataActivo[0]).draw();
	}

	for (let activoNoPlaqueado of data["activos_no_plaqueados"]) {
		let { data: dataActivo } = await axiosInstance.get(noPlaqueadosView, {
			params: {
				serie: activoNoPlaqueado,
			},
		});

		table.row.add(dataActivo[0]).draw();
	}
});

$("[data-action=subir-deshecho]").on("click", subirDeshecho);
async function subirDeshecho() {
	const deshechoTitle = $("#deshecho-title").text();
	const activos = table.rows().data().toArray();

	const activosPlaqueados = activos
		.filter((activo) => activo.tipo === PLAQUEADO)
		.map((activo) => activo.id);
	const activosNoPlaqueados = activos
		.filter((activo) => activo.tipo === NO_PLAQUEADO)
		.map((activo) => activo.id);

	if (activos.length === 0) {
		Swal.fire("Por favor añada activos");
	}

	let body = {
		referencia: deshechoTitle,
		detalles: "DESHECHO",
		solicitante: userId,
		tipo: "Deshecho",
		activosPlaqueados,
		activosNoPlaqueados,
	};

 
		const res = await axiosInstance.post(tramitesView, body).catch((error) => {
			if(error.request.status > 300 && error.request.status < 500){
				Warning.fire({
					text: "Error al añadir tramite",
					footer: error.request.response
				})
			} else if(error.request.status >= 500){
				Err.fire("Parece que hubo un error en el servidor");
			}
		});

		Success.fire("Se subio el deshecho con éxito");
}
