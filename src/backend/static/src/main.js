import "bootstrap/dist/css/bootstrap.css";
import "sweetalert2/src/sweetalert2.scss";
import "select2/dist/css/select2.min.css";

import "datatables.net-bs4/css/dataTables.bootstrap4.css";
import select2 from "select2";
import $ from "jquery";
import dt from "datatables.net-bs4";
import buttons from "datatables.net-buttons";
import * as bootstrap from "bootstrap";
import feather from "feather-icons";

feather.icons["x-circle"].attrs = {
	...feather.icons["x-circle"].attrs,
	fill: "red",
	color: "white",
};

$.fn.extend({
	isValid: function () {
		return this[0].checkValidity();
	},

	setInvalid: function (msg) {
		this[0].setCustomValidity(msg);
		this[0].reportValidity();
	},
	setValid: function () {
		this[0].setCustomValidity("");
		this[0].reportValidity();
	},
	showModal: function (labelText) {
		let modal = new bootstrap.Modal(this[0]);

		if (modal) {
			let label = $(this[0]).find("#modalLabel");
			if (label) {
				label.text(labelText);
			}
			modal.show();
		}
	},

	only: function (event, handler) {
		$(this[0]).off();
		$(this[0]).on(event, (ev) => {
			handler(ev);
		});
	},
});

window.$ = $;

dt(window, $);
buttons(window, $);

select2($);
window.bootstrap = bootstrap;
window.feather = feather;
