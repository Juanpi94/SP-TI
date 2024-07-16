const { default: Swal } = require('sweetalert2');
const XLSX = require('xlsx');
import axios from 'axios';
import { formatearFecha } from './recursos/dateFormat';

/**
 * Django necesita el token CSRF por seeguridad, esta función la recupera con el fin
 * de incorporarla en los headers de axios
 * @returns {string} El token CSRF
 */
const getCSRFToken = () => {
    const tokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
    return tokenElement.value;
}

const config = {
    headers: {
        "X-CSRFToken": getCSRFToken(),
        "Content-Type": "application/json"
    }
}

function format_text(text) {
    // Elimina los acentos y convierte a minúsculas
    return text.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function dateValidate(fecha) {
    // Paso 1: Verificar el formato usando una expresión regular
    const regex1 = /^\d{4}-\d{2}-\d{2}$/;
    const regex2 = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex1.test(fecha) && !regex2.test(fecha)) {
        return null; // El formato no coincide
    }
    // Determinar el formato y descomponer la fecha
    let año, mes, dia;
    if (regex1.test(fecha)) {
        [año, mes, dia] = fecha.split('-').map(Number);
    } else {
        [dia, mes, año] = fecha.split('-').map(Number);
    }
    // Paso 2: Verificar que la fecha sea válida
    const fechaObj = new Date(año, mes - 1, dia); // Meses son 0-indexados en JS
    // Verificar que los componentes de la fecha sean correctos
    if (fechaObj.getFullYear() !== año || fechaObj.getMonth() + 1 !== mes || fechaObj.getDate() !== dia) {
        return null; // La fecha no es válida
    }
    // La fecha tiene el formato correcto y es válida, devolver en formato YYYY-MM-DD
    return `${año.toString().padStart(4, '0')}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
}

function floatClearValor(valor) {
    // Filtrar NaN
    if (isNaN(valor)) {
        return 0.0;
    }
    if (valor) {
        valor = valor.toString().replace(/[^\d\.-]/g, '');
        valor = parseFloat(valor);
    } else {
        valor = 0.0;
    }
    return valor;
}

// Evento de botón
document.getElementById('loadData').addEventListener('click', () => {
    // Obtiene el archivo seleccionado
    const file = document.getElementById('fileData').files[0];

    if (!file) {
        Swal.fire({
            icon: "error",
            title: "Error al leer el archivo",
            text: "Verifica que esté correctamente cargado",
        });
        return;
    }

    const columDatas = {};
    // Lee el archivo
    const reader = new FileReader();
    reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'array' });

        // Selecciona la hoja de trabajo deseada
        const sheet = workbook.Sheets['Activos General'];

        // Obtiene todos los datos en formato JSON
        const rowData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Encargaso de generar una lista de datos unicos
        for (let i = 0; i < 44; i++) {

            // Convierte los datos en un array
            const data = rowData.map((row) => row[i]);

            // Elimina los valores duplicados
            const uniqueData = [...new Set(data)];

            // Creamos el diccionario con los dartos
            columDatas[uniqueData[0]] = uniqueData.slice(1);
        } // console.log(columDatas);

        // -------------- Guardar Tipo -------------- //
        columDatas['Tipo'].forEach(element => {
            let dataObject = {
                nombre: element,
                detalle: element
            }
            axios.post('/api/tipo/', dataObject, config).catch(() => {
                console.log(`Tipo: ${element} ya existe`)
            });
        }, console.log('Tipos terminado con exito'));
        // -------------- Fin de Guardar Tipo -------------- //

        // -------------- Guardar SubTipo -------------- //
        columDatas['Subtipo'].forEach(element => {
            let dataObject = {
                nombre: element,
                detalle: element
            }
            axios.post('/api/subtipos/', dataObject, config).catch(() => {
                console.log(`Subtipo: ${element} ya existe`)
            });
        }, console.log('Subtipos terminado con exito'));
        // -------------- Fin de Guardar SubTipo -------------- //

        // -------------- Guardar los proveedores -------------- //
        let prov_data = [];
        let exclu_prov = [];
        for (let x = 1; x < rowData.length; x++) {
            let nombreData = rowData[x][28];
            let telefonoData = rowData[x][29];
            let correoData = rowData[x][30];

            if (nombreData != undefined && nombreData != " -" && nombreData != null) {
                if (!prov_data.some(item => item.nombre === nombreData)) {
                    prov_data.push({ nombre: nombreData, telefono: telefonoData, correo: correoData });
                }
            } else {
                // Sentencia para acregar al documento
                exclu_prov.push({ posicion: x + 1, nombre: nombreData, telefono: telefonoData, correo: correoData });
            }
        } prov_data.forEach(element => {
            axios.post('/api/proveedor/', element, config).catch(() => {
                console.log(`Proveedor: ${element.nombre} ya existe`);
            });
        }, console.log('Proveedores terminado con exito'));
        // -------------- Fin de Guardar los proveedores -------------- //

        // -------------- Guardar categorias -------------- //
        let cat_data = [];
        columDatas['Categoría'].forEach(element => {
            if (element != undefined && element != "" && element != null) {
                if (!cat_data.some(item => format_text(item.nombre) === format_text(element))) {
                    cat_data.push({ nombre: element, detalle: element });
                }
            }
        });
        cat_data.forEach(element => {
            axios.post('/api/categorias/', element, config).catch(() => {
                console.log(`Categoria: ${element.nombre} ya existe`);
            });
        }, console.log('Categorias terminado con exito'));
        // -------------- Fin de Guardar categorias -------------- //

        // -------------- Guardar Partidas -------------- //
        let par_data = [];
        rowData.slice(1).forEach(element => {
            if (element[19] != undefined && element[19] != "" && element[19] != null && element[19] != "-") {
                if (!par_data.some(item => item.codigo === element[19])) {
                    par_data.push({ codigo: element[19], descripcion: element[20] });
                }
            }
        });
        par_data.forEach(element => {
            axios.post('/api/partidas/', element, config).catch(() => {
                console.log(`Partida: ${element.codigo} ya existe`);
            });
        }, console.log('Partidas terminado con exito'));
        // -------------- Fin de Guardar Partidas -------------- //

        // -------------- Guardar compras -------------- //
        let com_data = [];
        let exclu_com = [];
        let posicion = 1;
        axios.get(`/api/proveedor/`).then((response) => {
            const proveedor_list = response.data;
            let proveedor_pending = proveedor_list.find(proveedor => proveedor.nombre === 'Pendiente');

            rowData.slice(1).forEach(compDetalles => {
                let numero_orden_compra = compDetalles[22];
                if (numero_orden_compra != undefined && numero_orden_compra != "" && numero_orden_compra != null) {
                    if (numero_orden_compra != "Pendiente" && numero_orden_compra != "-") {
                        if (!com_data.some(item => item.numero_orden_compra === numero_orden_compra)) {
                            let id_proveedor = -1;
                            for (let i = 0; i < proveedor_list.length; i++) {
                                if (proveedor_list[i].nombre === compDetalles[28]) {
                                    id_proveedor = proveedor_list[i].id;
                                    break;
                                } else {
                                    id_proveedor = proveedor_pending.id;
                                }
                            }
                            com_data.push({
                                numero_orden_compra,
                                numero_solicitud: compDetalles[25],
                                origen_presupuesto: compDetalles[23],
                                decision_inicial: compDetalles[24],
                                numero_procedimiento: compDetalles[26],
                                numero_factura: compDetalles[27],
                                proveedor: id_proveedor,
                                detalle: compDetalles[31],
                                informe_tecnico: compDetalles[33]
                            });
                        }
                    } else {
                        exclu_com.push({ posicion: posicion + 1, numero_orden_compra: numero_orden_compra });
                    }
                }
                posicion++;
            });
            com_data.forEach(element => {
                axios.post('/api/compra/', element, config).catch((error) => {
                    console.log(error)
                });
            });
        }), console.log('Compras terminado con exito');
        // -------------- Fin de Guardar compras -------------- //

        // -------------- Guardar Red -------------- //
        let red_data = [];
        rowData.slice(1).forEach(element => {
            if (element[40] != undefined && element[40] != "" && element[40] != null) {
                if (!red_data.some(item => item.MAC === element[40])) {
                    if (element[41] == undefined || element[41] == "" || element[41] == null) {
                        element[41] = "por definir";
                    }
                    if (element[42] == undefined || element[42] == "" || element[42] == null) {
                        element[42] = "por definir";
                    }
                    red_data.push({ MAC: element[40], IP: element[41], IP_switch: element[42], IP6: "por definir" });
                }
            }
        });
        red_data.push({ MAC: "No aplica", IP: "---", IP_switch: "---", IP6: "---" });
        red_data.forEach(element => {
            axios.post('/api/red/', element, config).catch(() => {
                console.log(`Red: ${element.MAC} ya existe`);
            });
        }), console.log('Redes terminado con exito');
        // -------------- Fin de Guardar Red -------------- //

        // -------------- Guardar funcionarios -------------- //
        let fun_data = [];
        // Combina las listas
        const fucionarList = [...columDatas['Custodio'], ...columDatas['Coordinador']];
        // Convierte a Set para eliminar duplicados y luego de vuelta a Array
        const custodios = [...new Set(fucionarList)];
        function Tel_format(numero) {
            // Elimina todo lo que no sea dígitos
            const soloNumeros = numero.trim().replace(/\D/g, '');

            // Formatea según el patrón deseado
            if (soloNumeros.length === 7) { // Asegúrate de que tenga la longitud esperada para este formato
                return `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4)}`;
            } else {
                return 'Formato no válido'; // O maneja el error como prefieras
            }
        }
        custodios.forEach(element => {
            if (element != undefined && element != "" && element != null) {
                if (!fun_data.some(item => item.nombre === element)) {
                    fun_data.push({
                        cedula: 'por definir',
                        nombre_completo: element.trim(),
                        correo_institucional: element.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '@ucr.ac.cr', // Esto solo es para efecto de practica
                        correo_personal: 'por definir',
                        telefono_oficina: Tel_format('12345678'),
                        telefono_personal: Tel_format('12345678'),
                    });
                }
            }
        });
        fun_data.forEach(element => {
            axios.post('/api/funcionarios/', element, config).catch(() => {
                console.log(`Funcionario: ${element.nombre_completo} ya existe`);
            });
        }), console.log('Funcionarios terminado con exito');
        // -------------- Fin de Guardar funcionarios -------------- //

        // -------------- Guardar Estados -------------- //
        let est_data = [];
        columDatas['Estado'].forEach(element => {
            if (element != undefined && element != "" && element != null) {
                if (!est_data.some(item => format_text(item.nombre) === format_text(element))) {
                    est_data.push({ nombre: element, descripcion: element });
                }
            }
        });
        est_data.forEach(element => {
            axios.post('/api/estados/', element, config).catch(() => {
                console.log(`Estado: ${element.nombre} ya existe`);
            });
        }, console.log('Estados terminado con exito'));
        // -------------- Fin de Guardar Estados -------------- //

        // -------------- Guardar Unidad Universitaria -------------- //
        let uni_data = [];
        axios.get(`/api/funcionarios/`).then((response) => {
            const funcionarios_list = response.data;

            for (let x = 1; x < rowData.length; x++) {
                let codigo = rowData[x][13];
                let nombre = rowData[x][14];
                let coordinador = rowData[x][15];

                if (codigo != undefined && codigo != "" && codigo != null) {
                    if (!uni_data.some(item => item.codigo === codigo)) {
                        let id_coordinador = -1;
                        for (let i = 0; i < funcionarios_list.length; i++) {
                            if (funcionarios_list[i].nombre_completo === coordinador) {
                                id_coordinador = funcionarios_list[i].id;
                                break;
                            }
                        }
                        uni_data.push({ codigo, nombre, coordinador: id_coordinador });
                    }
                }
            }
            uni_data.forEach(element => {
                axios.post('/api/unidades/', element, config).catch(() => {
                    console.log(`Unidad: ${element.nombre} ya existe`);
                });
            });
        }), console.log('Unidades terminado con exito');
        // -------------- Fin de Guardar Unidad Universitaria -------------- //

        // -------------- Guardar Ubicaciones -------------- //
        //Colocar un tiempo de espera de 2 segundos para que se guarden los datos
        setTimeout(() => {
            let ubi_data = [];
            axios.get(`/api/instalaciones/`).then((response) => {
                const instalaciones_list = response.data;

                axios.get(`/api/funcionarios/`).then((response) => {
                    const funcionarios_list = response.data;

                    axios.get(`/api/unidades/`).then((response) => {
                        const unidades_list = response.data;

                        for (let x = 1; x < rowData.length; x++) {
                            let ubicacion = rowData[x][16];
                            let instalacion = rowData[x][1];
                            let custodio = rowData[x][12];
                            let unidad = rowData[x][14];

                            if (ubicacion != undefined && ubicacion != "" && ubicacion != null) {
                                if (!ubi_data.some(item => format_text(item.ubicacion) === format_text(ubicacion))) {
                                    let id_instalacion = -1;
                                    let id_custodio = -1;
                                    let id_unidad = -1;

                                    for (let i = 0; i < instalaciones_list.length; i++) {
                                        if (instalaciones_list[i].ubicacion === instalacion) {
                                            id_instalacion = instalaciones_list[i].id;
                                            break;
                                        }
                                    }
                                    for (let i = 0; i < funcionarios_list.length; i++) {
                                        if (funcionarios_list[i].nombre_completo === custodio) {
                                            id_custodio = funcionarios_list[i].id;
                                            break;
                                        }
                                    }
                                    for (let i = 0; i < unidades_list.length; i++) {
                                        if (unidades_list[i].nombre === unidad) {
                                            id_unidad = unidades_list[i].codigo;
                                            break;
                                        }
                                    }
                                    ubi_data.push({
                                        ubicacion,
                                        instalacion: id_instalacion,
                                        custodio: id_custodio,
                                        unidades: id_unidad
                                    });
                                }
                            }
                        }
                        ubi_data.forEach(element => {
                            axios.post('/api/ubicaciones/', element, config).catch(() => {
                                console.log(`Ubicacion: ${element.ubicacion} ya existe`);
                            });
                        });
                    });
                });
            }).then(() => {
                console.log('Ubicaciones terminado con exito');
            });
        }, 8000);
        // -------------- Fin de Guardar Ubicaciones -------------- //

        // -------------- Tiempo de espera para evitar errores -------------- //
        setTimeout(() => {
            // Esperando 4 segundos para evitar errores
        }, 8000);
        // -------------- Fin Tiempo de espera para evitar errores -------------- //

        // -------------- Guardar Activos -------------- //

        let full_data = [];
        let act_plac_data = [];
        posicion = 1;
        let exclu_act = [];
        setTimeout(() => {
            async function fetchData() {
                try {
                    const urls = [
                        '/api/tipo/',
                        '/api/subtipos/',
                        '/api/categorias/',
                        '/api/estados/',
                        '/api/red/',
                        '/api/ubicaciones/',
                        '/api/compra/'
                    ];
                    const requests = urls.map(url => axios.get(url));
                    const responses = await Promise.all(requests);
                    const [tipo_list, subtipo_list, categoria_list, estado_list, red_list, ubicacion_list, compra_list] = responses.map(response => response.data);

                    let red_pending = red_list.find(red => red.MAC.toLowerCase() === 'no aplica');
                    console.log(ubicacion_list);

                    // Aquí puedes trabajar con las listas obtenidas
                    for (let x = 1; x < rowData.length; x++) {
                        let placa = rowData[x][0];
                        let serie = rowData[x][7];
                        let ubicacion_anterior = 1;
                        let nombre = rowData[x][5] + " " + rowData[x][6];
                        let tipo = rowData[x][3];
                        let subtipo = rowData[x][4];
                        let modelo = rowData[x][6];
                        let marca = rowData[x][5];
                        let valor_colones = floatClearValor(rowData[x][8]);
                        let valor_dolares = floatClearValor(rowData[x][9]);
                        let garantia = dateValidate(rowData[x][10]);
                        let fecha_registro = dateValidate(rowData[x][34]);
                        let fecha_ingreso = dateValidate(rowData[x][21]);
                        let observacion = rowData[x][11];
                        let categoria = rowData[x][2];
                        let compra = rowData[x][22];
                        let red = rowData[x][40] ? rowData[x][40] : red_pending.MAC;
                        let ubicacion = rowData[x][16];
                        let estado = rowData[x][17];
                        let partida = rowData[x][19];

                        // Esto solo genera la lista para verificar que todos los campos tengan un valor valido o nulo
                        if (placa != null && placa != undefined && placa != "" && placa != "Pendiente" && placa != "S/P") {
                            // Verifica si el elemento ya existe en la lista y si no lo encuentra, lo agrega.
                            if (!full_data.some(item => item.placa === placa)) {
                                // Agrega el id del tipo
                                const tipoObj = tipo_list.find(item => item.nombre === tipo);
                                const id_tipo = tipoObj ? tipoObj.id : -1;

                                // Agrega el id del subtipo
                                const subtipoObj = subtipo_list.find(item => item.nombre === subtipo);
                                const id_subtipo = subtipoObj ? subtipoObj.id : -1;

                                // Agrega el id de la categoria
                                const categoriaObj = categoria_list.find(item => item.nombre.toLowerCase().normalize() === categoria.toLowerCase().normalize());
                                const id_categoria = categoriaObj ? categoriaObj.id : -1;

                                // Agrega el id del estado
                                const estadoObj = estado_list.find(item => item.nombre === estado);
                                const id_estado = estadoObj ? estadoObj.id : -1;

                                // Agrega el id de la ubicacion
                                const ubicacionObj = ubicacion_list.find(item => item.ubicacion === ubicacion);
                                const id_ubicacion = ubicacionObj ? ubicacionObj.id : -1;

                                // Agrega el id de la red
                                const redObj = red_list.find(item => item.MAC === red);
                                const id_red = redObj ? redObj.id : null;

                                // Agrega el id de la compra
                                let id_compra = null;
                                compra_list.forEach(element => {
                                    if (compra != null && compra != undefined && compra != "" && compra != "Pendiente" && compra != "-") {
                                        if (element.numero_orden_compra.toString() === compra.toString()) {
                                            id_compra = element.numero_orden_compra;
                                        }
                                    } else {
                                        id_compra = null;
                                    }
                                });

                                full_data.push({
                                    placa, serie, ubicacion_anterior, nombre, tipo: id_tipo,
                                    subtipo: id_subtipo, modelo, marca, valor_colones,
                                    valor_dolares, garantia, fecha_registro, fecha_ingreso,
                                    observacion, categoria: id_categoria, compra: id_compra, red: id_red,
                                    ubicacion: id_ubicacion, estado: id_estado, partida
                                });
                            } else {
                                exclu_act.push({ posicion: x + 1, placa: placa, duplicidad: "Placa duplicada" });
                            }
                        } else {
                            // Verifica si el elemento ya existe en la lista.
                            // si lo encuentra, le agrega un nuevo campo.
                            // y si no lo encuentra, lo agrega.
                            let addInfoData = exclu_act.find(item => item.posicion === x + 1);
                            if (addInfoData) {
                                addInfoData.valor_invalido = "Placa pendiente o valor no valido";
                            } else {
                                exclu_act.push({ posicion: x + 1, placa: placa, valor_invalido: "Placa pendiente o valor no valido" });
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                }

            } fetchData().then(() => {
                // Sentencia para verificar los datos validos
                for (let s = 0; s < full_data.length; s++) {
                    // Verifica si la garantia es valida
                    if (full_data[s].garantia === null) {
                        let addInfoData = exclu_act.find(item => item.placa === full_data[s].placa);
                        if (addInfoData) {
                            addInfoData.fecha_garantia_invalida = "Fecha de garantia no valida";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, fecha_garantia_invalida: "Fecha de garantia no valida" });
                        }
                    }
                    // Verifica si la fecha de registro es valida
                    if (full_data[s].fecha_registro === null) {
                        let addInfoData = exclu_act.find(item => item.placa === full_data[s].placa);
                        if (addInfoData) {
                            addInfoData.fecha_registro_invalida = "Fecha de registro no valida";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, fecha_registro_invalida: "Fecha de registro no valida" });
                        }
                    }
                    // Verifica si la fecha de ingreso es valida
                    if (full_data[s].fecha_ingreso === null) {
                        let addInfoData = exclu_act.find(item => item.placa === full_data[s].placa);
                        if (addInfoData) {
                            addInfoData.fecha_ingreso_invalida = "Fecha de ingreso no valida";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, fecha_ingreso_invalida: "Fecha de ingreso no valida" });
                        }
                    }
                    // Verifica si la categoria es valida
                    if (full_data[s].categoria == -1 && typeof full_data[s].categoria != "number") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.categoria_invalida = "Categoria no valida";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, categoria_invalida: "Categoria no valida" });
                        }
                    }
                    // Verifica si la serie es valida
                    if (full_data[s].serie == null || full_data[s].serie == undefined || full_data[s].serie == "") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.serie_invalida = "Serie no valida";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, serie_invalida: "Serie no valida" });
                        }
                    }
                    // Verifica si el tipo es valido
                    if (full_data[s].tipo == -1 && typeof full_data[s].tipo != "number") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.tipo_invalido = "Tipo no valido";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, tipo_invalido: "Tipo no valido" });
                        }
                    }
                    // verifica si el subtipo es valido
                    if (full_data[s].subtipo == -1 && typeof full_data[s].subtipo != "number") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.subtipo_invalido = "Subtipo no valido";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, subtipo_invalido: "Subtipo no valido" });
                        }
                    }
                    // Verifica si el modelo es valido
                    if (full_data[s].modelo == null || full_data[s].modelo == undefined || full_data[s].modelo == "") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.modelo_invalido = "Modelo no valido";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, modelo_invalido: "Modelo no valido" });
                        }
                    }
                    // Verifica si la marca es valida
                    if (full_data[s].marca == null || full_data[s].marca == undefined || full_data[s].marca == "") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.marca_invalida = "Marca no valida";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, marca_invalida: "Marca no valida" });
                        }
                    }
                    if (full_data[s].valor_colones > 0.0 || full_data[s].valor_dolares > 0.0) {
                        // Al menos uno de los valores es mayor a 0.0, considerado válido
                    } else {
                        // Ambos valores son 0.0 o inválidos
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.valor_colones_invalido = "Valor en colones no valido";
                            addInfoData.valor_dolares_invalido = "Valor en dolares no valido";
                        } else {
                            exclu_act.push({
                                posicion: s + 1,
                                placa: full_data[s].placa,
                                valor_colones_invalido: "Valor en colones no valido",
                                valor_dolares_invalido: "Valor en dolares no valido"
                            });
                        }
                    }
                    // Verifica si los estados son validos
                    if (full_data[s].estado == -1 && typeof full_data[s].estado != "number") {
                        let addInfoData = exclu_act.find(item => item.posicion === s + 1);
                        if (addInfoData) {
                            addInfoData.estado_invalido = "Estado no valido";
                        } else {
                            exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, estado_invalido: "Estado no valido" });
                        }
                    }
                }
            }).then(() => {
                full_data.forEach(elementA => {
                    const existExcluAct = exclu_act.some(elementB => elementB.placa === elementA.placa);
                    if (!existExcluAct) {
                        act_plac_data.push(elementA);
                    }
                });
                console.log(act_plac_data);

                    act_plac_data.forEach(element => {
                    axios.post('/api/activos_plaqueados/', element, config).catch((err) => {
                        console.log(err);
                        console.log(`Activo: ${element.placa} ya existe`);
                    });
                }
                ), console.log('Activos terminado con exito');
            });
        }, 10000);
        // -------------- Fin de Guardar Activos -------------- //
    };

    reader.readAsArrayBuffer(file);
});

//Los campos con 'pendientes' y fechas rebotan y se almacenan en un documento nuevo para su debida depuración
// Separar la importacion de los activos plaqueados y no plaqueados
// Crear una funcion para la actualización de los datos con el checkbox
// Crear una funcion para respaldar la base de datos manualmente 3 archivos