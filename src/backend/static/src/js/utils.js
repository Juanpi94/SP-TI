import Swal from "sweetalert2";

//Esta clase es utilizada para evitar repetir la misma declaración fetch
export class Fetcher {
	base_url = "";
	suffix = "";
	csrfToken = "";
	constructor(csrfToken = "", suffix = "") {
		this.csrfToken = csrfToken;
		this.suffix = suffix;
		this.getFetcher = this.getFetcher.bind(this);
		this.fetch = this.fetch.bind(this);
	}

	setBaseUrl(new_base_url) {
		this.base_url = new_base_url;
		return this;
	}
	getFetcher() {
		return this.fetch;
	}
	fetch(url, params = {}) {
		const fetchConfig = {
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": this.csrfToken,
			},
			cache: "no-cache",
			credentials: "same-origin",
			...params,
		};
		let finalUrl = this.base_url + this.suffix + url;
		if (!finalUrl.endsWith("/")) {
			finalUrl += "/";
		}
		return fetch(finalUrl, fetchConfig);
	}
}

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

export const getTableRowData = (table, row) => {};
