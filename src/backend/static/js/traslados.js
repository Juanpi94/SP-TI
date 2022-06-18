const csrfToken = getCsrf()
const tramitesFetcher = new Fetcher(tramitesView, csrfToken).getFetcher()
const plaqueadosFetcher = new Fetcher(plaqueadosView, csrfToken).getFetcher()
const trasladosFetcher = new Fetcher(trasladosView, csrfToken).getFetcher()



const table = $("#activos-table").DataTable({
    dom: "t",
    language: {
        emptyTable: "Aún no hay datos para esta tabla",
    },
    rowId: "id",
    columns: [
        { data: "id", render: idRenderer, sortable: false },
        { data: "placa", title: "Placa" },
        { data: "marca", title: "Marca" },
        { data: "modelo", title: "Modelo" },
        { data: "serie", title: "Serie" },
        { data: "ubicacion", title: "Ubicación Actual" },
        { data: "destino", title: "Destino", render: destinoRender },
        {
            data: null,
            title: "controles",
            render: controlesRender,
            name: "controles",
        },
    ],
});


$("select").select2({
    language: {
        noResults: () => "No hay resultados para esta busqueda",
    },
    theme: "default",
});



$(".select2-container").addClass("col");

function idRenderer(id) {
    return `<input name="id-input" type='hidden' value="${id}"/>`;
}
function controlesRender() {
    return "<button data-action='delete-row'>Eliminar</button>";
}

function destinoRender() {
    return destinoSelect;
}


table.on("draw.dt", () => {
    $("[data-action=delete-row]").on("click", deleteRowHandler);
    $(".destino-select").removeAttr("id")
    $(".destino-select").select2();
    
});
const spacingElement = $("[data-spacing]");


//Action listeners para los botones
$("[data-action=add]").on("click", () => {
    const spacing = parseFloat(spacingElement.css("--spacing"));
    const newSpacing = spacing + 2;
    spacingElement.css("--spacing", newSpacing + "rem");
});

$("[data-action=substract]").on("click", () => {
    const spacing = parseFloat(spacingElement.css("--spacing"));
    const newSpacing = Math.max(0, spacing - 2);
    spacingElement.css("--spacing", newSpacing + "rem");
});

$("[data-action=pdf]").on("click", () => {
    $(".pdf-container").toggleClass("export");
    table.column("controles:name").visible(false);
    const motivoTextArea = $("#id_motivo")
    const text = motivoTextArea.val();
    const motivoPdf = $("#motivo_for_pdf")
    motivoTextArea.hide()
    motivoPdf.text(text)
    motivoPdf.height(motivoTextArea.height())
    motivoPdf.show();
    const opts = {
        html2canvas:  { scale: 3 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    }
    const worker = html2pdf().set(opts).from($(".pdf-container")[0]).save(`Traslado-${new Date().toISOString()}.pdf`);
    worker.then(() => {
        $(".pdf-container").toggleClass("export");
        table.column("controles:name").visible(true);
        motivoPdf.text("")
        motivoPdf.hide()
        motivoTextArea.show()
    });
});



$("[data-action=add_placa]").on("click", async () => {
    const id = $("#id_placa").select2("data")[0].id;
    console.log(table.rows().data().toArray())
    const repeated = table.rows().data().toArray().some((activo) => {
        return activo.id == id
    })

    if(repeated){
        Err.fire("Este activo ya se agrego una vez")
        return
    }

    const response = await plaqueadosFetcher({ url: id + "/"});
    const data = await response.json();
    if(data.tramite){
        const confirmacion = await swal.fire({
            title: "Este activo ya tiene un tramite en curso, ¿añadir de todas formas?",
            showCancelButton: true,
            confirmButtonText: "Añadir",
            cancelButtonText: `Cancelar`,
        })
        if(!confirmacion.isConfirmed) return
    }
    table.row.add(data).draw();
});

$("[data-action=add_serie]").on("click", async () => {
    const id = $("#id_serie").select2("data")[0].id;
    const response = await plaqueadosFetcher({ url: id + "/"}); 
    const data = await response.json();

    if(data.tramite){
        const confirmacion = await swal.fire({
            title: "Este activo ya tiene un tramite en curso, ¿añadir de todas formas?",
            showCancelButton: true,
            confirmButtonText: "Añadir",
            cancelButtonText: `Cancelar`,
        })
        if(!confirmacion.isConfirmed) return
    }
    table.row.add(data).draw();
});

$("[data-action=load]").on("click", async () => {

    const id = $("#id_tramite").select2("data")[0].id
    if(!id) return
    let res = await tramitesFetcher({url: id + "/"})

    tramite = await res.json()
 
    /* 
    detalles: "adsadsd"
    estado: "Pendiente"
    fecha: "2022-05-03"
    id: 4
    recipiente: 1
    referencia: "ValidacionesTest-SP"
    remitente: 2
    solicitante: 1
    tipo: "Traslado"
    urgencia: "H"
    */
    const {id: tramiteId, detalles, fecha, recipiente, referencia, remitente, activos} = tramite

    $("#id_consecutivo").val(referencia)
    $("#id_fecha").val(fecha)
    $("#id_recipiente").select2("val", `${recipiente}`)
    $("#id_remitente").select2("val", `${remitente}`)
    $("#id_motivo").val(detalles)


    if(table.data().count()){
        table.rows({page: 'current'} ).remove()
    }

    for (let activo of activos){
        table.row.add(activo)
    }
    table.draw();

    let bodyDestinos = activos.map(activo => activo.id)
    let responseDestinos = await trasladosFetcher({url: "get_destinos/", method: "POST", body: JSON.stringify({activos: bodyDestinos})})
    let traslados = await responseDestinos.json()
    traslados = JSON.parse(traslados)
    for (traslado of traslados){
        $(`#${traslado.activo}`).find("select").select2("val", `${traslado.destino}`)
    }
   

})


$("[data-action=subir-traslado]").on("click", subirTrasladoHandler);

function deleteRowHandler(event) {
    table.row($(this).parents("tr")).remove().draw();
}



async function subirTrasladoHandler(event) {

    event.preventDefault();
    const referencia = $("#id_consecutivo").val();
    const fecha = $("#id_fecha").val();
    const remitente = $("#id_remitente").select2("data")[0].id;
    const recipiente = $("#id_recipiente").select2("data")[0].id;
    const detalles = $("#id_motivo").val();
    const activos = $("[name=id-input]").map((i, input) => $(input).val()).toArray();
    const destinos = $("[name=destino]").map(
        (i, input) => $(input).select2("data")
    ).map((i, data) => data.id).toArray().filter((id) => id)

    let body = {
        referencia,
        fecha,
        remitente,
        recipiente,
        detalles,
        solicitante: userId,
        activos,
    };

    for (let field in body) {
        if (!body[field]) {
            Err.fire(`El campo ${field.toUpperCase()} está vacio`);
            return;
        }
    }
    if(!activos || !activos.length){
        Err.fire("No se agregaron activos");
        return;
    }

    if(!destinos || !destinos.length || activos.length !== destinos.length){
        Err.fire(`Uno o más activos no tienen destino`);
        return;
    }


    const bodyTramites = JSON.stringify(body);
    let bodyTraslados = activos.map((activo, idx) => {
        return {
            activo,
            destino: destinos[idx]
        }
    });
    bodyTraslados = JSON.stringify(bodyTraslados)

    const tramiteResponse = await tramitesFetcher({body: bodyTramites, method: "POST"})
    const trasladosResponse = await trasladosFetcher({body: bodyTraslados, method: "POST"})


    const tramiteStatus = tramiteResponse.status;
    if(tramiteStatus > 200 && tramiteStatus < 300){
        Success.fire("Se realizó el tramite con exito");
    } else if (tramiteStatus === 400){
        const warningText = await tramiteResponse.text()
        
        Warning.fire({
            text: "Error con los datos ingresados",
            footer: warningText
        });
    } else if (tramiteStatus > 500){
        Err.fire("Hubo un problema con el servidor")
    }
}