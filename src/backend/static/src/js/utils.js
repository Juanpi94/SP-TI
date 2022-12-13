import axios from "axios";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
//Esta clase es utilizada para evitar repetir la misma declaración fetch
const axiosInst = axios.create({
	baseURL: "http://127.0.0.1:8000/",
});

axiosInst.interceptors.request.use(
	(config) => {
		const method = config.method.toUpperCase();
		if (
			method === "POST" ||
			method === "PUT" ||
			method === "PATCH" ||
			method === "DELETE"
		) {
			config.headers["X-CSRFToken"] = getCsrf();
		}
		if (!config.url.endsWith("/")) {
			config.url += "/";
		}
		let data = JSON.stringify(config.data);

		console.log(
			`method: ${method}\nURL: ${
				config.url
			}\nTIME: ${new Date()}\nHeaders: ${JSON.stringify(
				config.headers
			)}\nDATA: ${data}`
		);
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);
export const axiosInstance = axiosInst;

export function getCsrf() {
	const csrfToken = $("[name=csrfmiddlewaretoken]").val();
	return csrfToken;
}

export const Success = Swal.mixin({
	icon: "success",
});

export const Err = Swal.mixin({
	icon: "error",
});

export const Warning = Swal.mixin({
	icon: "warning",
});

export const download = (blob, filename) => {
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	window.URL.revokeObjectURL(url);
};

export const toExcel = (data) => {
	parsedData = JSON.stringify(data);
	return axios({
		url: "/api/exportar/",
		method: "POST",
		responseType: "json",
		data: { data: parsedData },
		headers: {
			"X-CSRFToken": getCsrf(),
		},
	});
};

export const toPdf = (element, name) => {
	const opts = {
		html2canvas: { scale: 3 },
		margin: [40, 0, 22, 0],
		jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
		pagebreak: {
			avoid: "tr",
			mode: ["avoid-all", "css", "legacy"],
		},
	};
	const addFooter = (pdf) => {
		const height = pdf.internal.pageSize.getHeight();
		const width = pdf.internal.pageSize.getWidth();

		pdf.setFontSize(10);
		pdf.line(0, height - 20, width, height - 20);
		pdf.text("TEL. 2511-7428 / FAX 2661-2501", width / 2, height - 15, {
			align: "center",
		});
		pdf.text("e-mail: atic.sp@ucr.ac.cr", width / 2, height - 5, {
			align: "center",
		});
	};
	const addHeader = (pdf) => {
		const height = pdf.internal.pageSize.getHeight();
		const width = pdf.internal.pageSize.getWidth();
		const ucrLogo = document.getElementById("identificador-ucr-img");
		const srpLogo = document.getElementById("identificador-srp-img");
		pdf.addImage(ucrLogo, "png", 20, 5, 50, 30);
		pdf.addImage(srpLogo, "jpg", width - 70, 15, 50, 15);
		pdf.line(0, height - 20, width, height - 20);
		pdf.setFontSize(13);
		pdf.setFont(pdf.getFont().fontName, "bold");
		pdf.text("Ciudad Universitaria “Arnoldo Ferreto Segura“", width / 2, 40, {
			align: "center",
		});
	};
	const worker = html2pdf()
		.set(opts)
		.from(element)
		.toPdf()
		.get("pdf")
		.then((pdf) => {
			let totalPages = pdf.internal.getNumberOfPages();

			for (let i = 1; i <= totalPages; i++) {
				pdf.setPage(i);

				addFooter(pdf);
				addHeader(pdf);
			}
		})
		.save(name);
	return worker;
};
