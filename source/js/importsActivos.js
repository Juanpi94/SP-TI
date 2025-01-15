import {
	updateActivated, loadSuccess, updateDeactivated,
	loadingDatas, errFile, updateSuccess, updateDatas,
	notUpdateData, noLoadDatas
} from "./recursos/loadUpdateDatas/messages.js";
import { postDatas, axiosPut, axiosGetAll, axiosGetOne } from "./recursos/loadUpdateDatas/axiosActions.js";
import { format_text, tel_format, dateValidate, floatClearValor, validateType } from "./recursos/loadUpdateDatas/formats.js";
const { default: Swal } = require('sweetalert2');
const XLSX = require('xlsx');

let check = false;
let countAct = 0;
let countUpd = 0;

let informe_errores = [];
// Función para descargar el informe de errores
function informeDeActivos(informe_errores) {
	if (informe_errores && informe_errores.length > 0) {
		// Crear un nuevo libro de trabajo
		const wb = XLSX.utils.book_new();

		// Recorrer el objeto informe_errores
		informe_errores.forEach((informe) => {
			for (const [nombreHoja, datos] of Object.entries(informe)) {
				if (datos && datos.length > 0) {
					// Convertir los datos a un formato de hoja de trabajo
					const ws = XLSX.utils.json_to_sheet(datos);

					// Ajustar el ancho de las columnas
					const colWidths = datos.reduce((acc, row) => {
						Object.keys(row).forEach((key, i) => {
							const value = row[key] ? row[key].toString().length : 10;
							acc[i] = Math.max(acc[i] || 10, value);
						});
						return acc;
					}, []);
					ws['!cols'] = colWidths.map(w => ({ wch: w }));

					// Aplicar estilos a la primera fila
					const range = XLSX.utils.decode_range(ws['!ref']);
					for (let C = range.s.c; C <= range.e.c; ++C) {
						const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
						if (!ws[cell_address]) continue;
						ws[cell_address].s = {
							font: { bold: true },
							alignment: { horizontal: "center" }
						};
					}

					// Añadir la hoja de trabajo al libro con el nombre correspondiente
					XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
				}
			}
		});

		// Generar el archivo .xlsx
		const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

		// Función para convertir el binario a octeto
		function s2ab(s) {
			const buf = new ArrayBuffer(s.length);
			const view = new Uint8Array(buf);
			for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
			return buf;
		}

		const fecha = new Date().toISOString().replace(/[:\-]/g, '').replace('T', '_').substring(0, 15);
		// Crear un enlace y descargar el archivo
		const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "informe_de_errores_" + fecha + ".xlsx";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	} else {
		console.log("No hay datos para descargar.");
	}
}

function getElementByIds(id1, id2) {
	let element = document.getElementById(id1);
	if (!element) {
		element = document.getElementById(id2);
	}
	return element;
}

// Función para verificar si se activa la actualización de los datos
document.getElementById('update-check').addEventListener('click', () => {
	if (document.getElementById('update-check').checked) {
		// Mensaje de activación
		updateActivated();
		check = true;
	} else {
		// Mensaje de desactivación
		updateDeactivated();
		check = false;
	}
});

// Función para decidir si es activo plaqueado o no plaqueado
const loadDataElement = getElementByIds('plaqueado', 'noPlaqueado');

// Evento de botón para cargar el archivo
loadDataElement.addEventListener('click', () => {
	// Obtiene el archivo seleccionado
	const file = document.getElementById('fileData').files[0];

	let activoSelect = loadDataElement.id;

	if (!file) {
		errFile();
		return;
	}

	const columDatas = {};

	const reader = new FileReader();
	reader.onload = (event) => {

		if (!check) {
			loadingDatas(); // Mensaje de cargando datos...
		} else {
			updateDatas(); // Mensaje de actualización de datos...
		}

		const workbook = XLSX.read(event.target.result, {
            type: 'array',
            cellDates: true, // Interpretar celdas como fechas si tienen formato de fecha
        });
    
        // Selecciona la hoja de trabajo deseada
        const sheet = workbook.Sheets['Activos General'] || workbook.Sheets['Activos_General'];
    
        // Configuración para leer datos en formato JSON
        const rowData = XLSX.utils.sheet_to_json(sheet, {
            header: 1, // Mantener el formato de matriz
            raw: false, // Permitir conversión automática de fechas
        });
    
        for (let i = 0; i < rowData[0].length; i++) {
            // Convierte los datos en un array
            const data = rowData.map((row) => row[i]);
    
            // Asignar valores al objeto, manejando fechas y símbolos correctamente
            columDatas[data[0]] = data.slice(1).map((value) => {
                if (typeof value === 'string') {
                    if (value.includes("$") || value.includes("₡")) {
                        // Borra los espcios en blanco
                        value = value.replace(/\s/g, '');

                        // Eliminar símbolos $ y ₡ si existen
                        value = value.replace(/[$₡]/g, '');

                        // Reemplazar comas por puntos
                        value = value.replace(/,/g, '.');

                        return value;
                    }
    
                    // Formatear fecha dd/mm/yyyy a YYYY-MM-DD
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                        const [day, month, year] = value.split('/');
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                }
                return value;
            });
        } console.log(columDatas);

		// -------------- Guardar Tipo -------------- //
		let tipo_data = [];
		let exclu_tipo = [];
		let tipo_list = [];
		async function tiposSave() {
			tipo_list = await axiosGetAll('tipo');

			columDatas['Tipo'].forEach((element, pos) => {
				if (!validateType(element)) {
					exclu_tipo.push({ posicion: pos + 2, tipo_invalido: `Tipo no valido [${element}]` });
				} else {
					if (!tipo_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!tipo_data.some(item => format_text(item.nombre) === format_text(element))) {
							tipo_data.push({ nombre: element, detalle: element });
						}
					}
				}
			});

			!check ? postDatas('tipo', tipo_data) : console.log("Tipos no aplica para actualizar");
		} tiposSave();
		// -------------- Fin de Guardar Tipo -------------- //

		// -------------- Guardar SubTipo -------------- //
		let subtipo_data = [];
		let exclu_subtipo = [];
		let subtipo_list = [];
		async function subtiposSave() {
			subtipo_list = await axiosGetAll('subtipos');

			columDatas['Subtipo'].forEach((element, pos) => {
				if (!validateType(element)) {
					exclu_subtipo.push({ posicion: pos + 2, subtipo_invalido: `Subtipo no valido [${element}]` });
				} else {
					if (!subtipo_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!subtipo_data.some(item => format_text(item.nombre) === format_text(element))) {
							subtipo_data.push({ nombre: element, detalle: element });
						}
					}
				}
			});

			!check ? postDatas('subtipos', subtipo_data) : console.log("Subtipos no aplica para actualizar");
		} subtiposSave();
		// -------------- Fin de Guardar SubTipo -------------- //

		// -------------- Guardar los proveedores -------------- //
		let prov_data = [];
		let exclu_prov = [];
		let proveedor_list = [];
		async function proveedoresSave() {
			proveedor_list = await axiosGetAll('proveedor');

			if (prov_data.length === 0 && !proveedor_list.some(item => item.nombre === 'Pendiente')) {
				prov_data.push({ nombre: "Pendiente", telefono: tel_format('0000-0000'), correo: "Pendiente" });
			}

			columDatas['Nombre Proveedor'].forEach((element, pos) => {
				const telefono = columDatas['Telefono Proveedor'][pos];
				const correo = columDatas['Correo Empresa'][pos];
				if (!validateType(element)) {
					exclu_prov.push({ posicion: pos + 2, nombre: element, telefono: telefono, correo: correo });
				} else {
					if (!proveedor_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!prov_data.some(item => item.nombre === element)) {
							prov_data.push({ nombre: element, telefono: telefono, correo: correo });
						}
					}
				}
			});

			function uploadProveedores() {
				let listPush = [];
				prov_data.forEach(async (proveedor) => {
					if (!proveedor_list.some(item => item.nombre === proveedor.nombre)) {
						listPush.push(proveedor);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('proveedor', listPush);
				} else {
					console.log("No hay proveedores para cargar");
				}
			}

			function updateProveedores() {
				let updateProveedores = [];
				prov_data.forEach(async (proveedor) => {
					let provBD = proveedor_list.find(item => item.nombre === proveedor.nombre);
					let telSame = proveedor.telefono === provBD.telefono;
					let correoSame = proveedor.correo === provBD.correo;
					if (!telSame || !correoSame) {
						proveedor.id = provBD.id;
						updateProveedores.push(proveedor);
					}
				});

				if (updateProveedores.length > 0) {
					countAct++;
					updateProveedores.forEach(async (proveedor) => {
						axiosPut('proveedor', proveedor.id, proveedor);
					}), console.log("Proveedores actualizados con éxito");
				} else {
					console.log("No hay proveedores para actualizar");
				}
			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadProveedores() : updateProveedores();
		} proveedoresSave();
		// -------------- Fin de Guardar los proveedores -------------- //

		// -------------- Guardar categorias -------------- //
		let cat_data = [];
		let exclu_cat = [];
		let categoria_list = [];
		async function categoriasSave() {
			categoria_list = await axiosGetAll('categorias');

			columDatas['Categoría'].forEach((element, pos) => {
				if (!validateType(element)) {
					exclu_cat.push({ posicion: pos + 2, categoria_invalida: `Categoria no valida [${element}]` });
				} else {
					if (!categoria_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!cat_data.some(item => format_text(item.nombre) === format_text(element))) {
							cat_data.push({ nombre: element, detalle: element });
						}
					}
				}
			});

			!check ? postDatas('categorias', cat_data) : console.log("Categorias no aplica para actualizar");
		} categoriasSave();
		// -------------- Fin de Guardar categorias -------------- //

		// -------------- Guardar Partidas -------------- //
		let par_data = [];
		let exclu_par = [];
		let part_list = [];
		async function partidasSave() {
			part_list = await axiosGetAll('partidas');

			columDatas['Código Partida'].forEach((element, pos) => {
				let descripcion = columDatas['Descripción Partida'][pos];
				if (!validateType(element)) {
					exclu_par.push({ posicion: pos + 2, partida_invalida: "Partida no valida [" + element + "]" });
				} else {
					if (!part_list.some(item => item.codigo === element)) {
						if (!par_data.some(item => item.codigo === element)) {
							par_data.push({ codigo: element, descripcion: descripcion });
						}
					}
				}
			});

			function uploadPartidas() {
				let listPush = [];
				par_data.forEach(async (partida) => {
					if (!part_list.some(item => item.codigo === partida.codigo)) {
						listPush.push(partida);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('partidas', listPush);
				} else {
					console.log("No hay partidas para cargar");
				}
			}

			function updatePartidas() {
				let updatePartidas = [];
				par_data.forEach(async (partida) => {
					let parBD = part_list.find(item => item.codigo === partida.codigo);
					let descSame = partida.descripcion === parBD.descripcion;
					if (!descSame) {
						partida.id = parBD.id;
						updatePartidas.push(partida);
					}
				});

				if (updatePartidas.length > 0) {
					countAct++;
					updatePartidas.forEach(async (partida) => {
						axiosPut('partidas', partida.id, partida);
					}), console.log("Partidas actualizadas con éxito");
				} else {
					console.log("No hay partidas para actualizar");
				}
			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadPartidas() : updatePartidas();
		} partidasSave();
		// -------------- Fin de Guardar Partidas -------------- //

		// -------------- Guardar Modelos -------------- //
		let mod_data = [];
		let exclu_mod = [];
		let mod_list = [];
		async function modelosSave() {
			mod_list = await axiosGetAll('modelos');

			columDatas['Modelo'].forEach((element, pos) => {
				if (!validateType(element)) {
					exclu_mod.push({ posicion: pos + 2, modelo_invalido: "Modelo no valido [" + element + "]" });
				} else {
					if (!mod_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!mod_data.some(item => format_text(item.nombre) === format_text(element))) {
							mod_data.push({ nombre: element });
						}
					}
				}
			});

			!check ? postDatas('modelos', mod_data) : console.log("Modelos no aplica para actualizar");
		} modelosSave();
		// -------------- Fin de Guardar Modelos -------------- //

		// -------------- Guardar Marcas -------------- //
		let mar_data = [];
		let exclu_mar = [];
		let mar_list = [];
		async function marcasSave() {
			mar_list = await axiosGetAll('marcas');

			columDatas['Marca'].forEach((element, pos) => {
				if (!validateType(element)) {
					exclu_mar.push({ posicion: pos + 2, marca_invalida: "Marca no valida [" + element + "]" });
				} else {
					if (!mar_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!mar_data.some(item => format_text(item.nombre) === format_text(element))) {
							mar_data.push({ nombre: element });
						}
					}
				}
			});

			!check ? postDatas('marcas', mar_data) : console.log("Marcas no aplica para actualizar");
		} marcasSave();
		// -------------- Fin de Guardar Marcas -------------- //

		// -------------- Guardar compras -------------- //
		let comp_data = [];
		let exclu_comp = [];
		let comp_list = [];
		async function comprasSave() {
			comp_list = await axiosGetAll('compra');

			const proveedor_list = await axiosGetAll('proveedor');
			const proveedor_pending = proveedor_list.find(proveedor => proveedor.nombre === 'Pendiente');

			columDatas['Referencia de compra'].forEach((numCompra, pos) => {
				let numero_orden_compra = numCompra;
				let proveedor = columDatas['Nombre Proveedor'][pos];
				let numero_solicitud = columDatas['Numero solicitud'][pos];
				let origen_presupuesto = columDatas['Origen Presupuesto'][pos];
				let decision_inicial = columDatas['Decisión Inicial'][pos];
				let numero_procedimiento = columDatas['Numero procedimiento'][pos];
				let numero_factura = columDatas['Numero Factura'][pos];
				let detalle = columDatas['Detalles de Presupuesto'][pos];
				let informe_tecnico = columDatas['Informe Técnico'][pos];

				// Agrega el id del proveedor
				const proveedorObj = proveedor_list.find(item => item.nombre === proveedor);
				const id_proveedor = proveedorObj ? proveedorObj.id : proveedor_pending.id;

				if (!validateType(numero_orden_compra)) {
					exclu_comp.push({ posicion: pos + 2, orden_compra_invalido: "Numero de orden no valido [" + numero_orden_compra + "]" });
				} else {

					if (!comp_list.some(item => item.numero_orden_compra === String(numero_orden_compra))) {
						if (!comp_data.some(item => item.numero_orden_compra === numero_orden_compra)) {
							comp_data.push({
								numero_orden_compra, proveedor: id_proveedor, numero_solicitud,
								origen_presupuesto, decision_inicial, numero_procedimiento,
								numero_factura, detalle, informe_tecnico
							});
						}
					}

				}
			});

			function uploadCompras() {
				let listPush = [];
				comp_data.forEach(async (compra) => {
					if (!comp_list.some(item => item.numero_orden_compra === compra.numero_orden_compra)) {
						listPush.push(compra);
					}
				});

				if (listPush.length > 0) {
					countUpd++;
					postDatas('compra', listPush);
				} else {
					console.log("No hay compras para cargar");
				}
			}

			function updateCompras() {
				let updateCompras = [];
				comp_data.forEach(async (compra) => {
					let compBD = comp_list.find(item => item.numero_orden_compra === compra.numero_orden_compra);
					let proveedorSame = compra.proveedor === compBD.proveedor;
					let numSolSame = compra.numero_solicitud === compBD.numero_solicitud;
					let origenSame = compra.origen_presupuesto === compBD.origen_presupuesto;
					let decisionSame = compra.decision_inicial === compBD.decision_inicial;
					let numProcSame = compra.numero_procedimiento === compBD.numero_procedimiento;
					let numFactSame = compra.numero_factura === compBD.numero_factura;
					let detalleSame = compra.detalle === compBD.detalle;
					let infoSame = compra.informe_tecnico === compBD.informe_tecnico;
					if (!proveedorSame || !numSolSame || !origenSame || !decisionSame ||
						!numProcSame || !numFactSame || !detalleSame || !infoSame) {
						compra.id = compBD.id;
						updateCompras.push(compra);
					}
				});

				if (updateCompras.length > 0) {
					countAct++;
					updateCompras.forEach(async (compra) => {
						axiosPut('compra', compra.id, compra);
					}), console.log("Compras actualizadas con éxito");
				} else {
					console.log("No hay compras para actualizar");
				}
			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadCompras() : updateCompras();
		} comprasSave();
		// -------------- Fin de Guardar compras -------------- //

		// -------------- Guardar Red -------------- //
		let red_data = [];
		let exclu_red = [];
		let red_list = [];
		async function redesSave() {
			red_list = await axiosGetAll('red');
			if (red_list.length === 0 && !red_list.some(item => item.MAC === 'No aplica')) {
				red_data.push({ MAC: "No aplica", IP: "---", IP_switch: "---", IP6: "---" });
			}

			columDatas['MAC'].forEach((element, pos) => {
				if (!validateType(element)) {
					exclu_red.push({ posicion: pos + 2, red_invalida: "Red no valida [" + element + "]" });
				} else {
					if (!red_list.some(item => item.MAC === element)) {
						if (!red_data.some(item => item.MAC === element)) {
							if (!validateType(columDatas['IP'][pos])) {
								columDatas['IP'][pos] = "Por definir";
							}
							if (!validateType(columDatas['IP Switch'][pos])) {
								columDatas['IP Switch'][pos] = "Por definir";
							}
							red_data.push({ MAC: element, IP: columDatas['IP'][pos], IP_switch: columDatas['IP Switch'][pos], IP6: "Por definir" });
						}
					}
				}
			});

			function uploadRedes() {
				let listPush = [];
				red_data.forEach(async (red) => {
					if (!red_list.some(item => item.MAC === red.MAC)) {
						listPush.push(red);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('red', listPush);
				} else {
					console.log("No hay redes para cargar");
				}
			}

			function updateRedes() {
				let updateRedes = [];
				red_data.forEach(async (red) => {
					let redBD = red_list.find(item => item.MAC === red.MAC);
					let ipSame = red.IP === redBD.IP;
					let ipSwitchSame = red.IP_switch === redBD.IP_switch;
					let ip6Same = red.IP6 === redBD.IP6;
					if (!ipSame || !ipSwitchSame || !ip6Same) {
						red.id = redBD.id;
						updateRedes.push(red);
					}
				});

				if (updateRedes.length > 0) {
					countAct++;
					updateRedes.forEach(async (red) => {
						axiosPut('red', red.id, red);
					}), console.log("Redes actualizadas con éxito");
				} else {
					console.log("No hay redes para actualizar");
				}
			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadRedes() : updateRedes();
		} redesSave();
		// -------------- Fin de Guardar Red -------------- //

		// -------------- Guardar funcionarios -------------- //
		let fun_data = [];
		let exclu_fun = [];
		let fun_list = [];
		async function funcionariosSave() {
			fun_list = await axiosGetAll('funcionarios');

			if (fun_list.length === 0 || !fun_list.some(item => item.nombre_completo === 'Por definir')) {
				fun_data.push({
					cedula: 'Por definir', nombre_completo: 'Por definir',
					correo_institucional: 'por_definir@ucr.ac.cr', correo_personal: 'por_definir@gmail.com',
					telefono_oficina: tel_format('12345678'), telefono_personal: tel_format('12345678')
				});
			} // Agregar el campo de Por definir si no hay datos

			columDatas['Custodio'].forEach((element, pos) => {
				let correo = columDatas['Correo institucional'][pos] ? columDatas['Correo institucional'][pos] : 'correo' + (pos + 2) + '@gmail.com';
				if (validateType(element)) {
					if (validateType(correo)) {
						// if (!fun_list.some(item => item.nombre_completo === element)) {
						if (!fun_data.some(item => item.nombre_completo === element)) {
							fun_data.push({
								cedula: 'Por definir',
								nombre_completo: element.trim(),
								correo_institucional: correo,
								correo_personal: 'Por definir',
								telefono_oficina: tel_format('12345678'),
								telefono_personal: tel_format('12345678'),
							});
						} else {
							let addInfoData = exclu_fun.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.custodio = element;
								addInfoData.correo_invalido = "Correo no valido";
							} else {
								exclu_fun.push({ posicion: pos + 2, custodio: element, correo_invalido: "Correo no valido" });
							}
						}
						// }
					} else {
						let addInfoData = exclu_fun.find(item => item.posicion === pos + 2);
						if (addInfoData) {
							addInfoData.funcionario_invalido = "Funcionario no valido [" + element + "]";
						} else {
							exclu_fun.push({ posicion: pos + 2, funcionario_invalido: "Funcionario no valido [" + element + "]" });
						}
					}
				}
			});

			function uploadFuncionarios() {
				let listPush = [];
				fun_data.forEach(async (funcionario) => {
					if (!fun_list.some(item => item.nombre_completo === funcionario.nombre_completo)) {
						listPush.push(funcionario);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('funcionarios', listPush);
				} else {
					console.log("No hay funcionarios para cargar");
				}
			}

			function updateFuncionarios() {
				let updateFuncionarios = [];
				fun_data.forEach(async (funcionario) => {
					let funBD = fun_list.find(item => item.nombre_completo === funcionario.nombre_completo);
					let cedulaSame = funcionario.cedula === funBD.cedula;
					let correo_inst_Same = funcionario.correo_institucional === funBD.correo_institucional;
					let correoSame = funcionario.correo_personal === funBD.correo_personal;
					let tel_ofiSame = funcionario.telefono_oficina === funBD.telefono_oficina;
					let tel_perSame = funcionario.telefono_personal === funBD.telefono_personal;
					if (!cedulaSame || !correo_inst_Same || !correoSame || !tel_ofiSame || !tel_perSame) {
						funcionario.id = funBD.id;
						updateFuncionarios.push(funcionario);
					}
				});

				if (updateFuncionarios.length > 0) {
					countAct++;
					updateFuncionarios.forEach(async (funcionario) => {
						await axiosPut('funcionarios', funcionario.id, funcionario);
					}), console.log("Funcionarios actualizados con éxito");
				} else {
					console.log("No hay funcionarios para actualizar");
				}
			}

			function uploadFuncionarios() {
				let listPush = [];
				fun_data.forEach(async (funcionario) => {
					if (!fun_list.some(item => item.nombre_completo === funcionario.nombre_completo)) {
						listPush.push(funcionario);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('funcionarios', listPush);
				} else {
					console.log("No hay funcionarios para cargar");
				}
			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadFuncionarios() : updateFuncionarios();
		} funcionariosSave();
		// -------------- Fin de Guardar funcionarios -------------- //

		// -------------- Guardar Estados -------------- //
		let est_data = [];
		let exclu_est = [];
		let est_list = [];
		async function estadosSave() {
			est_list = await axiosGetAll('estados');
			columDatas['Estado'].forEach((element, pos) => {
				const descEstado = columDatas['Descripción Estado'][pos];
				if (!validateType(element)) {
					exclu_est.push({ posicion: pos + 2, estado_invalido: "Estado no valido [" + element + "]" });
				} else {
					if (!est_list.some(item => format_text(item.nombre) === format_text(element))) {
						if (!est_data.some(item => format_text(item.nombre) === format_text(element))) {
							est_data.push({ nombre: element, descripcion: descEstado });
						}
					}
				}
			});

			function uploadEstados() {
				let listPush = [];
				est_data.forEach(async (estado) => {
					if (!est_list.some(item => format_text(item.nombre) === format_text(estado.nombre))) {
						listPush.push(estado);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('estados', listPush);
				} else {
					console.log("No hay estados para cargar");
				}
			}

			function updateEstados() {
				let updateEstados = [];
				est_data.forEach(async (estado) => {
					let estBD = est_list.find(item => format_text(item.nombre) === format_text(estado.nombre));
					let descSame = estado.descripcion === estBD.descripcion;
					if (!descSame) {
						estado.id = estBD.id;
						updateEstados.push(estado);
					}
				});

				if (updateEstados.length > 0) {
					countAct++;
					updateEstados.forEach(async (estado) => {
						await axiosPut('estados', estado.id, estado);
					}), console.log("Estados actualizados con éxito");
				} else {
					console.log("No hay estados para actualizar");
				}
			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadEstados() : updateEstados();
		} estadosSave();
		// -------------- Fin de Guardar Estados -------------- //

		// -------------- Guardar Coordinaciones Universitaria -------------- //
		let uni_data = [];
		let exclu_uni = [];
		let coordinacion_list = [];
		async function coordinacionesSave() {
			coordinacion_list = await axiosGetAll('coordinaciones');

			const funcionarios_list = await axiosGetAll('funcionarios');
			let coordinador_pending = funcionarios_list.find(funcionario => funcionario.nombre_completo === 'Por definir');
			if (uni_data.length === 0 && coordinacion_list.length === 0) {
				uni_data.push({ codigo: "99999", nombre: "Sin coordinación", coordinador: coordinador_pending.id });
			}

			columDatas['Código Coordinación'].forEach((element, pos) => {
				let nombre = columDatas['Coordinación'][pos];
				let coordinador = columDatas['Coordinador'][pos];

				if (!validateType(element)) {
					exclu_uni.push({ posicion: pos + 2, coordinacion_invalida: "Coordinación no valida [" + element + "]" });
				} else {
					if (!uni_data.some(item => item.codigo === element)) {
						let id_coordinador = funcionarios_list.find(funcionario => funcionario.nombre_completo === coordinador)?.id ?? -1;
                        if (id_coordinador === -1) {
                            id_coordinador = coordinador_pending.id;
                        }
						uni_data.push({ codigo: element, nombre, coordinador: id_coordinador });
					}
				}
			});

			function uploadCoordinaciones() {
				let listPush = [];
				uni_data.forEach(async (coordinacion) => {
					if (!coordinacion_list.some(item => item.codigo === String(coordinacion.codigo))) {
						listPush.push(coordinacion);
					}
				});
				if (listPush.length > 0) {
					countUpd++;
					postDatas('coordinaciones', listPush);
				} else {
					console.log("No hay coordinaciones para cargar");
				}
			}

			function updateCoordinaciones() {
				let updateCoordinaciones = [];
				uni_data.forEach(async (coordinacion) => {
					let uniBD = coordinacion_list.find(item => item.codigo === String(coordinacion.codigo));
					let coordSame = coordinacion.coordinador === uniBD.coordinador;
					let nameSame = coordinacion.nombre === uniBD.nombre;
					if (!coordSame || !nameSame) {
						updateCoordinaciones.push(coordinacion);
					}
				});

				if (updateCoordinaciones.length > 0) {
					countAct++;
					updateCoordinaciones.forEach(async (coordinacion) => {
						await axiosPut('coordinaciones', coordinacion.codigo, coordinacion);
					}), console.log("Coordinaciones actualizadas con éxito");
				} else {
					console.log("No hay coordinaciones para actualizar");
				}

			}

			// Ejecutar la función de acuerdo a la selección
			!check ? uploadCoordinaciones() : updateCoordinaciones();
		} coordinacionesSave();
		// -------------- Fin de Guardar Coordinaciones Universitaria -------------- //

		// -------------- Definicion del tiempo -------------- //
		const baseTime = 250; // Tiempo base en milisegundos
		const timePerItem = 40; // Tiempo adicional por cada elemento en milisegundos
		const delay = (baseTime + (rowData.length * timePerItem)) / 2;
		// -------------- Fn de Definicion del tiempo -------------- //

		// -------------- Guardar Ubicaciones -------------- //
		let ubi_data = [];
		let exclu_ubi = [];
		let ubicacion_list = [];
		setTimeout(() => {
			async function ubicacionesSave() {
				ubicacion_list = await axiosGetAll('ubicaciones');

				let instalaciones_list = await axiosGetAll('instalaciones');
				let funcionarios_list = await axiosGetAll('funcionarios');
				let coordinaciones_list = await axiosGetAll('coordinaciones');

				let coordinador_pending = funcionarios_list.find(funcionario => funcionario.nombre_completo === 'Por definir');
				let coordinacion_pending = coordinaciones_list.find(coordinacion => coordinacion.nombre === 'Sin coordinación');

				// Agregar el campo de Sin ubicación si no hay datos
				if (ubi_data.length === 0 && ubicacion_list.length === 0) {
					ubi_data.push({ ubicacion: "Sin ubicación", instalacion: 1, custodio: coordinador_pending.id, coordinacion: coordinacion_pending.codigo });
				}

				columDatas['Ubicación'].forEach((element, pos) => {
					let ubicacion = element;
					let instalacion = columDatas['Instalación'][pos];
					let custodio = columDatas['Custodio'][pos];
					let coordinacion = columDatas['Coordinación'][pos];

					if (validateType(ubicacion)) {
						if (!ubi_data.some(item => format_text(item.ubicacion) === format_text(ubicacion))) {
							let id_instalacion = instalaciones_list.find(item => item.ubicacion === instalacion)?.id ?? -1;
							let id_custodio = funcionarios_list.find(item => item.nombre_completo === custodio)?.id ?? -1;
							let id_coordinacion = coordinaciones_list.find(item => item.nombre === coordinacion)?.codigo ?? -1;

							ubi_data.push({
								ubicacion,
								instalacion: id_instalacion,
								custodio: id_custodio,
								coordinacion: id_coordinacion
							});
						}
					} else {
						exclu_ubi.push({ posicion: pos + 2, ubicacion_invalida: "Ubicacion no valida [" + ubicacion + "]" });
					}
				});

				function uploadUbicaciones() {
					let listPush = [];
					ubi_data.forEach(async (ubicacion) => {
						if (!ubicacion_list.some(item => format_text(item.ubicacion) === format_text(ubicacion.ubicacion))) {
							listPush.push(ubicacion);
						}
					});
					if (listPush.length > 0) countUpd++;
					postDatas('ubicaciones', listPush);
				}

				function updateUbicaciones() {
					let updateUbicaciones = [];
					ubi_data.forEach(async (ubicacion) => {
						let ubiBD = ubicacion_list.find(item => format_text(item.ubicacion) === format_text(ubicacion.ubicacion));
						let coordSame = ubicacion.coordinacion === ubiBD.coordinacion;
						let custSame = ubicacion.custodio === ubiBD.custodio;
						let instSame = ubicacion.instalacion === ubiBD.instalacion;
						if (!coordSame || !custSame || !instSame) {
							ubicacion.id = ubiBD.id;
							updateUbicaciones.push(ubicacion);
						}
					});

					if (updateUbicaciones.length > 0) {
						countAct++;
						updateUbicaciones.forEach(async (ubicacion) => {
							await axiosPut('ubicaciones', ubicacion.id, ubicacion);
						}), console.log("Ubicaciones actualizadas con éxito");
					} else {
						console.log("No hay ubicaciones para actualizar");
					}

				}

				// Ejecutar la función de acuerdo a la selección
				!check ? uploadUbicaciones() : updateUbicaciones();
			} ubicacionesSave();
		}, delay);
		// -------------- Fin de Guardar Ubicaciones -------------- //

		// -------------- Tiempo de espera para evitar errores -------------- //
		setTimeout(() => {
			// Esperando 4 segundos para evitar errores
		}, 4000);
		// -------------- Fin Tiempo de espera para evitar errores -------------- //

		// -------------- Guardar Activos -------------- //
		if (activoSelect === 'plaqueado') {
			let full_data = []; // Lista con todos los datos sin verificar
			let act_plac_data = []; // Lista con los valoes validos para enviar a la base de datos
			let exclu_act = [];
			let activo_list = [];
			setTimeout(() => {
				// Funcion para generar una lista con los datos de los activos antes de ser filtrados
				async function activosPlaqueadosSave() {
					activo_list = await axiosGetAll('activos_plaqueados');

					let tipo_list = await axiosGetAll('tipo');
					let subtipo_list = await axiosGetAll('subtipos');
					let categoria_list = await axiosGetAll('categorias');
					let estado_list = await axiosGetAll('estados');
					let marcas_list = await axiosGetAll('marcas');
					let modelos_list = await axiosGetAll('modelos');
					let red_list = await axiosGetAll('red');
					let ubicacion_list = await axiosGetAll('ubicaciones');
					let compra_list = await axiosGetAll('compra');

					let red_pending = red_list.find(red => red.MAC.toLowerCase() === 'no aplica');
					let ubicacion_pending = ubicacion_list.find(ubicacion => ubicacion.ubicacion.toLowerCase() === 'sin ubicación');

					// Crea un objeto con los datos de los activos sin filtrar
					columDatas['Placa'].forEach((element, pos) => {
						let placa = String(element);
						let tipo = columDatas['Tipo'][pos];
						let marca = columDatas['Marca'][pos];
						let serie = columDatas['Serie'][pos];
						let modelo = columDatas['Modelo'][pos];
						let nombre = marca + " " + modelo;
						let estado = columDatas['Estado'][pos];
						let subtipo = columDatas['Subtipo'][pos];
						let ubicacion = columDatas['Ubicación'][pos];
						let categoria = columDatas['Categoría'][pos];
						let ubicacion_anterior = ubicacion_pending.id;
						let partida = columDatas['Código Partida'][pos];
						let compra = columDatas['Referencia de compra'][pos];
						let observacion = columDatas['Observaciones de ingreso'][pos];
						let red = columDatas['MAC'][pos] ? columDatas['MAC'][pos] : null;
						let fecha_ingreso = dateValidate(columDatas['Fecha Ingreso'][pos]);
						let fecha_registro = dateValidate(columDatas['Fecha Registro'][pos]);
						let valor_colones = parseFloat(columDatas['Valor Colones'][pos]).toFixed(2);
                        console.log(typeof valor_colones, valor_colones);
						let valor_dolares = parseFloat(columDatas['Valor Dolares'][pos]).toFixed(2);
                        console.log(typeof valor_dolares, valor_dolares);
						let garantia = dateValidate(columDatas['Vencimiento de Garantía'][pos]);

						// Agrega el id del tipo
						const tipoObj = tipo_list.find(item => format_text(item.nombre) === format_text(tipo));
						const id_tipo = tipoObj ? tipoObj.id : null;

						//Agrega el id del subtipo
						const subtipoObj = subtipo_list.find(item => format_text(item.nombre) === format_text(subtipo));
						const id_subtipo = subtipoObj ? subtipoObj.id : null;

						// Agrega el id de la categoria
						const categoriaObj = categoria_list.find(item => format_text(item.nombre) === format_text(categoria));
						const id_categoria = categoriaObj ? categoriaObj.id : null;

						// Agrega el id del estado
						const estadoObj = estado_list.find(item => format_text(item.nombre) === format_text(estado));
						const id_estado = estadoObj ? estadoObj.id : null;

						// Agrega el id de la marca
						const marcaObj = marcas_list.find(item => format_text(item.nombre) === format_text(marca));
						const id_marca = marcaObj ? marcaObj.id : null;

						// Agrega el id del modelo
						const modeloObj = modelos_list.find(item => format_text(item.nombre) === format_text(modelo));
						const id_modelo = modeloObj ? modeloObj.id : null;

						// Agrega el id de la ubicacion
						const ubicacionObj = ubicacion_list.find(item => format_text(item.ubicacion) === format_text(ubicacion));
						const id_ubicacion = ubicacionObj ? ubicacionObj.id : null;

						// Agrega el id de la red
						const redObj = red_list.find(item => item.MAC === red);
						const id_red = redObj ? redObj.id : red_pending.id;

						// Agrega el id de la compra
						const compraObj = compra_list.find(item => item.numero_orden_compra === format_text(compra));
						const id_compra = compraObj ? compraObj.id : null;

						full_data.push({
							placa, serie, ubicacion_anterior, nombre, tipo: id_tipo,
							subtipo: id_subtipo, modelo: id_modelo, marca: id_marca, valor_colones,
							valor_dolares, garantia, fecha_registro, fecha_ingreso,
							observacion, categoria: id_categoria, compra: id_compra, red: id_red,
							ubicacion: id_ubicacion, estado: id_estado, partida

						});
					});

					// Verifica los datos invalidos para generar el informe de errores
					full_data.forEach((activo, pos) => {
						// verifica si la placa es valida
						if (!validateType(activo.placa)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.placa_invalida = "Placa no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, placa_invalida: "Placa no valida" });
							}
						}
						// Verifica si la garantia es valida
						if (!validateType(activo.garantia)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.fecha_garantia_invalida = "Fecha de garantia no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, fecha_garantia_invalida: "Fecha de garantia no valida" });
							}
						}
						// Verifica si la fecha de registro es valida
						if (!validateType(activo.fecha_registro)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.fecha_registro_invalida = "Fecha de registro no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, fecha_registro_invalida: "Fecha de registro no valida" });
							}
						}
						// Verifica si la fecha de ingreso es valida
						if (!validateType(activo.fecha_ingreso)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.fecha_ingreso_invalida = "Fecha de ingreso no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, fecha_ingreso_invalida: "Fecha de ingreso no valida" });
							}
						}
						// Verifica si la categoria es valida
						if (!validateType(activo.categoria)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.categoria_invalida = "Categoria no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, categoria_invalida: "Categoria no valida" });
							}
						}
						// Verifica si la serie es valida
						if (!validateType(activo.serie)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.serie_invalida = "Serie no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, serie_invalida: "Serie no valida" });
							}
						}
						// Verifica si el tipo es valido
						if (!validateType(activo.tipo)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.tipo_invalido = "Tipo no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, tipo_invalido: "Tipo no valido" });
							}
						}
						// verifica si el subtipo es valido
						if (!validateType(activo.subtipo)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.subtipo_invalido = "Subtipo no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, subtipo_invalido: "Subtipo no valido" });
							}
						}
						// Verifica si el modelo es valido
						if (!validateType(activo.modelo)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.modelo_invalido = "Modelo no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, modelo_invalido: "Modelo no valido" });
							}
						}
						// Verifica si la marca es valida
						if (!validateType(activo.marca)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.marca_invalida = "Marca no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, marca_invalida: "Marca no valida" });
							}
						}
						// verifica si el valor es valido
						if (activo.valor_colones >= 0.0 || activo.valor_dolares >= 0.0) {
							// Al menos uno de los valores es mayor a 0.0, considerado válido
						} else {
							// Ambos valores son 0.0 o inválidos
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.valor_colones_invalido = "Valor en colones no valido";
								addInfoData.valor_dolares_invalido = "Valor en dólares no valido";
							} else {
								exclu_act.push({
									posicion: pos + 2,
									placa: activo.placa,
									valor_colones_invalido: "Valor en colones no valido",
									valor_dolares_invalido: "Valor en dólares no valido"
								});
							}
						}
						// Verifica si la red es valida
						if (!validateType(activo.red)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.red_invalida = "Red no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, red_invalida: "Red no valida" });
							}
						}
						// Verifica si la ubicacion es valida
						if (!validateType(activo.ubicacion)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.ubicacion_invalida = "Ubicacion no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, ubicacion_invalida: "Ubicacion no valida" });
							}
						}
						// Verifica si el estado es valido
						if (!validateType(activo.estado)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.estado_invalido = "Estado no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, estado_invalido: "Estado no valido" });
							}
						}
						// Verifica si la partida es valida
						if (!validateType(activo.partida)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.partida_invalida = "Partida no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, partida_invalida: "Partida no valida" });
							}
						}
						// Verifica si la compra es valida
						if (!validateType(activo.compra)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.compra_invalida = "Compra no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, compra_invalida: "Compra no valida" });
							}
						}
						// Verifica si la ubicacion anterior es valida
						if (!validateType(activo.ubicacion_anterior)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.ubicacion_anterior_invalida = "Ubicacion anterior no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, placa: activo.placa, ubicacion_anterior_invalida: "Ubicacion anterior no valida" });
							}
						}
					});

					// Filtra los datos validos de los activos 
					// que no estan en la lista de excluidos
					full_data.forEach(element => {
						const existExcluAct = exclu_act.some(item => item.placa === element.placa);
						if (!existExcluAct) {
							act_plac_data.push(element);
						}
					});

					// ----------------- Area de validación (update/upload) ----------------- //

					// Funcion encargada de subir los activos a la base de datos
					function uploadActivos() {
						let listPush = [];
						act_plac_data.forEach(element => {
							if (!activo_list.some(item => item.placa === String(element.placa))) {
								listPush.push(element);
							}
						});
						if (listPush.length > 0) {
							countUpd++;
							//postDatas('activos_plaqueados', listPush);
						} else {
							console.log('No hay Activos para cargar');
						}
					}

					// Funcion encargada de actualizar los activos de la base de datos
					function updateActivos() {
						let updateActivos = [];
						act_plac_data.forEach(element => {
							let actBD = activo_list.find(item => item.placa === String(element.placa));
							let serieSame = element.serie === actBD.serie;
							let nombreSame = element.nombre === actBD.nombre;
							let valorColSame = element.valor_colones === actBD.valor_colones;
							let valorDolSame = element.valor_dolares === actBD.valor_dolares;
							let garantiaSame = element.garantia === actBD.garantia;
							let fechaRegSame = element.fecha_registro === actBD.fecha_registro;
							let fechaIngSame = element.fecha_ingreso === actBD.fecha_ingreso;
							let observacionSame = element.observacion === actBD.observacion;
							let ubicacionAntSame = element.ubicacion_anterior === actBD.ubicacion_anterior;
							let tipoSame = element.tipo === actBD.tipo;
							let subtipoSame = element.subtipo === actBD.subtipo;
							let modeloSame = element.modelo === actBD.modelo;
							let marcaSame = element.marca === actBD.marca;
							let redSame = element.red === actBD.red;
							let ubicacionSame = element.ubicacion === actBD.ubicacion;
							let estadoSame = element.estado === actBD.estado;
							let partidaSame = element.partida === actBD.partida;
							let compraSame = element.compra === actBD.compra;

							if (!serieSame || !nombreSame || !valorColSame || !valorDolSame ||
								!garantiaSame || !fechaRegSame || !fechaIngSame || !observacionSame ||
								!ubicacionAntSame || !tipoSame || !subtipoSame || !modeloSame ||
								!marcaSame || !redSame || !ubicacionSame || !estadoSame ||
								!partidaSame || !compraSame) {
								updateActivos.push(element);
							}
						});

						if (updateActivos.length > 0) {
							countAct++;
							updateActivos.forEach(async (element) => {
								axiosPut('activos_plaqueados', element.placa, element);
							}), console.log("Activos actualizados con éxito");
						} else {
							console.log("No hay activos para actualizar");
						}
					}

					// Verifica si se van a cargar o actualizar los activos
					!check ? uploadActivos() : updateActivos();

					// ----------------- Fin de Area de validación (update/upload) ----------------- //

				} activosPlaqueadosSave().then(() => {
					// Genera una lista con los errores encontrados 
					// para ser descargados como un archivo de excel
					informe_errores.push({
						'Informe tipos': exclu_tipo, 'Informe subtipos': exclu_subtipo, 'Informe proveedores': exclu_prov,
						'Informe categorias': exclu_cat, 'Informe partidas': exclu_par, 'Informe modelos': exclu_mod,
						'Informe marcas': exclu_mar, 'Informe compras': exclu_comp, 'Informe redes': exclu_red,
						'Informe funcionarios': exclu_fun, 'Informe estados': exclu_est, 'Informe coordinaciones': exclu_uni,
						'Informe ubicaciones': exclu_ubi, 'Informe activos': exclu_act
					});

					// Llamar a la función para descargar el informe
					informeDeActivos(informe_errores);

					// Verifica si se cargaron o actualizaron los activos
					// para mostrar un mensaje de éxito o error
					if (check) {
						if (countAct > 0) {
							console.log('Datos actualizados');
							Swal.close();
							updateSuccess();
						} else {
							console.log('Sin datos para actualizar');
							Swal.close();
							notUpdateData();
						}
					}
					else {
						if (countUpd > 0) {
							console.log('Datos cargados');
							Swal.close();
							loadSuccess();
						} else {
							console.log('Sin datos para cargar');
							Swal.close();
							noLoadDatas();
						}
					}

				});
			}, delay + 500);
		}
		// -------------- Fin de Guardar Activos -------------- //

		// -------------- Guardar Activos no plaqeuado -------------- //
		if (activoSelect === 'noPlaqueado') {
			let full_data = []; // Lista con todos los datos sin verificar
			let act_no_plac_data = []; // Lista con los valoes validos para enviar a la base de datos
			let exclu_act = [];
			let activo_list = [];
			setTimeout(() => {
				async function activosNoPlaqueadosSave() {
					activo_list = await axiosGetAll('activos_no_plaqueados');

					let tipo_list = await axiosGetAll('tipo');
					let subtipo_list = await axiosGetAll('subtipos');
					let categoria_list = await axiosGetAll('categorias');
					let estado_list = await axiosGetAll('estados');
					let marcas_list = await axiosGetAll('marcas');
					let modelos_list = await axiosGetAll('modelos');
					let red_list = await axiosGetAll('red');
					let ubicacion_list = await axiosGetAll('ubicaciones');
					let compra_list = await axiosGetAll('compra');

					let red_pending = red_list.find(red => red.MAC.toLowerCase() === 'no aplica');
					let ubicacion_pending = ubicacion_list.find(ubicacion => ubicacion.ubicacion.toLowerCase() === 'sin ubicación');

					// Crea un objeto con los datos de los activos sin filtrar
					columDatas['Serie'].forEach((element, pos) => {
						let serie = String(element);
						let tipo = columDatas['Tipo'][pos];
						let marca = columDatas['Marca'][pos];
						let modelo = columDatas['Modelo'][pos];
						let nombre = marca + " " + modelo;
						let estado = columDatas['Estado'][pos];
						let subtipo = columDatas['Subtipo'][pos];
						let ubicacion = columDatas['Ubicación'][pos];
						let categoria = columDatas['Categoría'][pos];
						let ubicacion_anterior = ubicacion_pending.id;
						let partida = columDatas['Código Partida'][pos];
						let compra = columDatas['Referencia de compra'][pos];
						let observacion = columDatas['Observaciones de ingreso'][pos];
						let red = columDatas['MAC'][pos] ? columDatas['MAC'][pos] : null;
						let fecha_ingreso = dateValidate(columDatas['Fecha Ingreso'][pos]);
						let fecha_registro = dateValidate(columDatas['Fecha Registro'][pos]);
						let valor_colones = String(floatClearValor(columDatas['Valor Colones'][pos]));
						let valor_dolares = String(floatClearValor(columDatas['Valor Dolares'][pos]));
						let garantia = dateValidate(columDatas['Vencimiento de Garantía'][pos]);

						// Agrega el id del tipo
						const tipoObj = tipo_list.find(item => format_text(item.nombre) === format_text(tipo));
						const id_tipo = tipoObj ? tipoObj.id : null;

						//Agrega el id del subtipo
						const subtipoObj = subtipo_list.find(item => format_text(item.nombre) === format_text(subtipo));
						const id_subtipo = subtipoObj ? subtipoObj.id : null;

						// Agrega el id de la categoria
						const categoriaObj = categoria_list.find(item => format_text(item.nombre) === format_text(categoria));
						const id_categoria = categoriaObj ? categoriaObj.id : null;

						// Agrega el id del estado
						const estadoObj = estado_list.find(item => format_text(item.nombre) === format_text(estado));
						const id_estado = estadoObj ? estadoObj.id : null;

						// Agrega el id de la marca
						const marcaObj = marcas_list.find(item => format_text(item.nombre) === format_text(marca));
						const id_marca = marcaObj ? marcaObj.id : null;

						// Agrega el id del modelo
						const modeloObj = modelos_list.find(item => format_text(item.nombre) === format_text(modelo));
						const id_modelo = modeloObj ? modeloObj.id : null;

						// Agrega el id de la ubicacion
						const ubicacionObj = ubicacion_list.find(item => format_text(item.ubicacion) === format_text(ubicacion));
						const id_ubicacion = ubicacionObj ? ubicacionObj.id : null;

						// Agrega el id de la red
						const redObj = red_list.find(item => item.MAC === red);
						const id_red = redObj ? redObj.id : red_pending.id;

						// Agrega el id de la compra
						const compraObj = compra_list.find(item => item.numero_orden_compra === format_text(compra));
						const id_compra = compraObj ? compraObj.id : null;

						full_data.push({
							serie, ubicacion_anterior, nombre, tipo: id_tipo,
							subtipo: id_subtipo, modelo: id_modelo, marca: id_marca, valor_colones,
							valor_dolares, garantia, fecha_registro, fecha_ingreso,
							observacion, categoria: id_categoria, compra: id_compra, red: id_red,
							ubicacion: id_ubicacion, estado: id_estado, partida

						});
					});

					// Verifica los datos invalidos para generar el informe de errores
					full_data.forEach((noPlaqueado, pos) => {
						// verifica si la serie es valida
						if (!validateType(noPlaqueado.serie)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.serie_invalida = "Serie no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, serie_invalida: "Serie no valida" });
							}
						}
						// Verifica si la garantia es valida
						if (!validateType(noPlaqueado.garantia)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.fecha_garantia_invalida = "Fecha de garantia no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, fecha_garantia_invalida: "Fecha de garantia no valida" });
							}
						}
						// Verifica si la fecha de registro es valida
						if (!validateType(noPlaqueado.fecha_registro)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.fecha_registro_invalida = "Fecha de registro no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, fecha_registro_invalida: "Fecha de registro no valida" });
							}
						}
						// Verifica si la fecha de ingreso es valida
						if (!validateType(noPlaqueado.fecha_ingreso)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.fecha_ingreso_invalida = "Fecha de ingreso no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, fecha_ingreso_invalida: "Fecha de ingreso no valida" });
							}
						}
						// Verifica si la categoria es valida
						if (!validateType(noPlaqueado.categoria)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.categoria_invalida = "Categoria no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, categoria_invalida: "Categoria no valida" });
							}
						}
						// Verifica si el tipo es valido
						if (!validateType(noPlaqueado.tipo)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.tipo_invalido = "Tipo no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, tipo_invalido: "Tipo no valido" });
							}
						}
						// verifica si el subtipo es valido
						if (!validateType(noPlaqueado.subtipo)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.subtipo_invalido = "Subtipo no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, subtipo_invalido: "Subtipo no valido" });
							}
						}
						// Verifica si el modelo es valido
						if (!validateType(noPlaqueado.modelo)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.modelo_invalido = "Modelo no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, modelo_invalido: "Modelo no valido" });
							}
						}
						// Verifica si la marca es valida
						if (!validateType(noPlaqueado.marca)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.marca_invalida = "Marca no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, marca_invalida: "Marca no valida" });
							}
						}
						// verifica si el valor es valido
						if (noPlaqueado.valor_colones >= 0.0 || noPlaqueado.valor_dolares >= 0.0) {
							// Al menos uno de los valores es mayor a 0.0, considerado válido
						} else {
							// Ambos valores son 0.0 o inválidos
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.valor_colones_invalido = "Valor en colones no valido";
								addInfoData.valor_dolares_invalido = "Valor en dólares no valido";
							} else {
								exclu_act.push({
									posicion: pos + 2,
									serie: noPlaqueado.serie,
									valor_colones_invalido: "Valor en colones no valido",
									valor_dolares_invalido: "Valor en dólares no valido"
								});
							}
						}
						// Verifica si la red es valida
						if (!validateType(noPlaqueado.red)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.red_invalida = "Red no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, red_invalida: "Red no valida" });
							}
						}
						// Verifica si la ubicacion es valida
						if (!validateType(noPlaqueado.ubicacion)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.ubicacion_invalida = "Ubicacion no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, ubicacion_invalida: "Ubicacion no valida" });
							}
						}
						// Verifica si el estado es valido
						if (!validateType(noPlaqueado.estado)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.estado_invalido = "Estado no valido";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, estado_invalido: "Estado no valido" });
							}
						}
						// Verifica si la partida es valida
						if (!validateType(noPlaqueado.partida)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.partida_invalida = "Partida no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, partida_invalida: "Partida no valida" });
							}
						}
						// Verifica si la compra es valida
						if (!validateType(noPlaqueado.compra)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.compra_invalida = "Compra no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, compra_invalida: "Compra no valida" });
							}
						}
						// Verifica si la ubicacion anterior es valida
						if (!validateType(noPlaqueado.ubicacion_anterior)) {
							let addInfoData = exclu_act.find(item => item.posicion === pos + 2);
							if (addInfoData) {
								addInfoData.ubicacion_anterior_invalida = "Ubicacion anterior no valida";
							} else {
								exclu_act.push({ posicion: pos + 2, serie: noPlaqueado.serie, ubicacion_anterior_invalida: "Ubicacion anterior no valida" });
							}
						}
					});

					// Filtra los datos validos de los activos 
					// que no estan en la lista de excluidos
					full_data.forEach(element => {
						const existExcluAct = exclu_act.some(item => item.serie === element.serie);
						if (!existExcluAct) {
							act_no_plac_data.push(element);
						}
					});

					// ----------------- Area de validación (update/upload) ----------------- //

					// Funcion encargada de subir los activos a la base de datos
					function uploadActivos() {
						let listPush = [];
						act_no_plac_data.forEach(element => {
							if (!activo_list.some(item => item.serie === String(element.serie))) {
								listPush.push(element);
							}
						});
						if (listPush.length > 0) {
							countUpd++;
							postDatas('activos_no_plaqueados', listPush);
						} else {
							console.log('No hay Activos para cargar');
						}
					}

					// Funcion encargada de actualizar los activos de la base de datos
					function updateActivos() {
						let updateActivos = [];
						act_no_plac_data.forEach(element => {
							let actBD = activo_list.find(item => item.serie === String(element.serie));
							let serieSame = element.serie === actBD.serie;
							let nombreSame = element.nombre === actBD.nombre;
							let valorColSame = element.valor_colones === actBD.valor_colones;
							let valorDolSame = element.valor_dolares === actBD.valor_dolares;
							let garantiaSame = element.garantia === actBD.garantia;
							let fechaRegSame = element.fecha_registro === actBD.fecha_registro;
							let fechaIngSame = element.fecha_ingreso === actBD.fecha_ingreso;
							let observacionSame = element.observacion === actBD.observacion;
							let ubicacionAntSame = element.ubicacion_anterior === actBD.ubicacion_anterior;
							let tipoSame = element.tipo === actBD.tipo;
							let subtipoSame = element.subtipo === actBD.subtipo;
							let modeloSame = element.modelo === actBD.modelo;
							let marcaSame = element.marca === actBD.marca;
							let redSame = element.red === actBD.red;
							let ubicacionSame = element.ubicacion === actBD.ubicacion;
							let estadoSame = element.estado === actBD.estado;
							let partidaSame = element.partida === actBD.partida;
							let compraSame = element.compra === actBD.compra;

							if (!serieSame || !nombreSame || !valorColSame || !valorDolSame ||
								!garantiaSame || !fechaRegSame || !fechaIngSame || !observacionSame ||
								!ubicacionAntSame || !tipoSame || !subtipoSame || !modeloSame ||
								!marcaSame || !redSame || !ubicacionSame || !estadoSame ||
								!partidaSame || !compraSame) {
								updateActivos.push(element);
							}
						});

						if (updateActivos.length > 0) {
							countAct++;
							updateActivos.forEach(async (element) => {
								axiosPut('activos_no_plaqueados', element.serie, element);
							}), console.log("Activos actualizados con éxito");
						} else {
							console.log("No hay activos para actualizar");
						}
					}

					// Verifica si se van a cargar o actualizar los activos
					!check ? uploadActivos() : updateActivos();
				} activosNoPlaqueadosSave().then(() => {
					// Genera una lista con los errores encontrados 
					// para ser descargados como un archivo de excel
					informe_errores.push({
						'Informe tipos': exclu_tipo, 'Informe subtipos': exclu_subtipo, 'Informe proveedores': exclu_prov,
						'Informe categorias': exclu_cat, 'Informe partidas': exclu_par, 'Informe modelos': exclu_mod,
						'Informe marcas': exclu_mar, 'Informe compras': exclu_comp, 'Informe redes': exclu_red,
						'Informe funcionarios': exclu_fun, 'Informe estados': exclu_est, 'Informe coordinaciones': exclu_uni,
						'Informe ubicaciones': exclu_ubi, 'Informe activos': exclu_act
					});

					// Llamar a la función para descargar el informe
					informeDeActivos(informe_errores);

					// Verifica si se cargaron o actualizaron los activos
					// para mostrar un mensaje de éxito o error
					if (check) {
						if (countAct > 0) {
							console.log('Datos actualizados');
							Swal.close();
							updateSuccess();
						} else {
							console.log('Sin datos para actualizar');
							Swal.close();
							notUpdateData();
						}
					}
					else {
						if (countUpd > 0) {
							console.log('Datos cargados');
							Swal.close();
							loadSuccess();
						} else {
							console.log('Sin datos para cargar');
							Swal.close();
							noLoadDatas();
						}
					}
				});
			}, delay + 500);
		}
		// -------------- Fin de Guardar Activos no plaqeuado -------------- //
	};

	reader.readAsArrayBuffer(file);
});

// Crear la actualización de los activos
// Separar la importacion de los activos plaqueados y no plaqueados
// Crear una funcion para respaldar la base de datos manualmente 3 archivos

// Controlar los errores de placas duplicadas

// "Sin información" para los campos que no se tiene los datos por antiguos
// formato de fecha es YYYY-MM-DD - 2021-12-31

// tipo de presupuesto, Tipo de Compra, verificar a futuro si se puede agregar...
// Validar que si se elimina una relacion base, eliminar todas sus relaciones
// Si se actualiza una relacion base, actualizar todas sus relaciones
// Verificar duplicidad evitando el campo en el que encuentra en el documento y verificar el las dos listas