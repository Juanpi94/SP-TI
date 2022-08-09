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

window.$ = $;

dt(window, $);
buttons(window, $);

select2($);
window.bootstrap = bootstrap;
window.feather = feather;
