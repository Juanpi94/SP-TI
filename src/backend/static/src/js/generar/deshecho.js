import Swal from "sweetalert2";
import { axiosInstance, Err, Success, toPdf } from "../utils";

const table = $("#activos-table").DataTable();

$("[data-action=pdf]").on("click", () => {
	const pdfContainer = $(".pdf-container")[0].cloneNode(true);
	pdfContainer.classList.toggle("export");

	const worker = toPdf(
		pdfContainer,
		`Deshecho-${new Date().toISOString()}.pdf`
	);

	worker.then(() => {});
});

$("[data-action=subir-deshecho]").on("click", subirDeshecho);
async function subirDeshecho() {
	const deshechoTitle = $("#deshecho-title").text();
	const activos = $("[data-type=plaqueado]")
		.map((i, input) => $(input).val())
		.toArray();

	if (activos.length === 0) {
		Swal.fire("Por favor añada activos");
	}
	const noPlaqueados = $("[data-type=no_plaqueado")
		.map((i, input) => $(input).val())
		.toArray();

	const body = {
		referencia: deshechoTitle,
		activos_plaqueados: activos,
		activos_no_plaqueados: noPlaqueados,
	};

	try {
		const res = await axiosInstance.post(deshechosView, body);

		Success.fire("Se subio el deshecho con éxito");
	} catch (exception) {
		Err.fire("Hubo un error al subir el deshecho");
	}
}
