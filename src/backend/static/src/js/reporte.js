import { download, toExcel } from "./utils";

const columns = $("th")
	.toArray()
	.map((header, index) => {
		return {
			name: header.textContent.replace(" ", "_"),
			data: header.textContent.replace(" ", "_"),
			targets: index,
		};
	});

const table = $("#datatable").DataTable({
	scrollX: true,
	columns,
	buttons: [
		{
			text: "Exportar visibles a excel",
			className: "btn  mt-3 btn-export-visibles",
			action: () => {
				const data = table.rows({ page: "current" }).data().toArray();
				console.log(data);
				toExcel(data).then((res) => {
					download(
						new Blob([Buffer.from(res.data["data"], "hex")]),
						`exported-${Date.now()}.xlsx`
					);
				});
			},
		},
		{
			text: "Exportar tabla a excel",
			className: "btn mt-3 btn-export-all",
			action: () => {
				const data = table.rows().data().toArray();

				console.log(data);
				toExcel(data).then((res) => {
					download(
						new Blob([Buffer.from(res.data["data"], "hex")]),
						`exportedTable-${Date.now()}.xlsx`
					);
				});
			},
		},
	],
});

table
	.buttons()
	.container()
	.appendTo($(".col-sm-12:eq(0)", table.table().container()));
