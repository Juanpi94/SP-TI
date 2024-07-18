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
	if (text === null || text === undefined || text === "") {
		return text;
	}
	return text.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function tel_format(numero) {
	// Elimina todo lo que no sea dígitos
	const soloNumeros = numero.trim().replace(/\D/g, '');

	// Formatea según el patrón deseado
	if (soloNumeros.length === 8) { // Asegúrate de que tenga la longitud esperada para este formato
		return `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4)}`;
	} else {
		return 'Formato no válido'; // O maneja el error como prefieras
	}
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

let informe_errores = [];
function informeDeActivos(informe_errores) {
	if (informe_errores && informe_errores.length > 0) {
		// Crear un nuevo libro de trabajo
		const wb = XLSX.utils.book_new();

		// Función para ajustar el ancho de las columnas
		function ajustarAnchoColumnas(ws) {
			const colAnchos = [];
			const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });
			if (datos.length > 0) {
				const encabezados = datos[0];
				encabezados.forEach((encabezado, i) => {
					const maxLongitud = encabezado.length;
					colAnchos[i] = { wch: maxLongitud + 2 }; // Añadir un poco de espacio extra
				});
			}
			ws['!cols'] = colAnchos;
		}

		// Función para aplicar estilos a la primera fila
		function aplicarEstilosPrimeraFila(ws) {
			const range = XLSX.utils.decode_range(ws['!ref']);
			for (let C = range.s.c; C <= range.e.c; ++C) {
				const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
				if (!ws[cell_address]) continue;
				ws[cell_address].s = {
					font: { bold: true, sz: 12 }, // Negrita y tamaño de fuente 12
					alignment: { horizontal: "center", vertical: "center" }, // Centrado
					fill: { fgColor: { rgb: "FFFF00" } } // Fondo amarillo
				};
			}
		}

		// Recorrer el objeto informe_errores
		informe_errores.forEach((informe) => {
			for (const [nombreHoja, datos] of Object.entries(informe)) {
				if (datos && datos.length > 0) {
					// Convertir los datos a un formato de hoja de trabajo
					const ws = XLSX.utils.json_to_sheet(datos);
					// Ajustar el ancho de las columnas
					ajustarAnchoColumnas(ws);
					// Aplicar estilos a la primera fila
					aplicarEstilosPrimeraFila(ws);
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

		let pos = 1;

		// -------------- Guardar Tipo -------------- //
		let tipo_data = [];
		let exclu_tipo = [];
		pos = 1;
		columDatas['Tipo'].forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!tipo_data.some(item => format_text(item.nombre) === format_text(element))) {
					tipo_data.push({ nombre: element, detalle: element });
				}
			} else {
				exclu_tipo.push({ posicion: pos + 1, tipo_invalido: "Tipo no valido [" + element + "]" });
			}
			pos++;
		});
		tipo_data.forEach(element => {
			axios.post('/api/tipo/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Tipos terminado con exito'));
		// -------------- Fin de Guardar Tipo -------------- //

		// -------------- Guardar SubTipo -------------- //
		let subtipo_data = [];
		let exclu_subtipo = [];
		pos = 1;
		columDatas['Subtipo'].forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!subtipo_data.some(item => format_text(item.nombre) === format_text(element))) {
					subtipo_data.push({ nombre: element, detalle: element });
				}
			} else {
				exclu_subtipo.push({ posicion: pos + 1, subtipo_invalido: "Subtipo no valido [" + element + "]" });
			}
			pos++;
		});
		subtipo_data.forEach(element => {
			axios.post('/api/subtipos/', element, config).catch((err) => {
				console.log(err.response.data);
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
			axios.post('/api/proveedor/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Proveedores terminado con exito'));
		// -------------- Fin de Guardar los proveedores -------------- //

		// -------------- Guardar categorias -------------- //
		let cat_data = [];
		let exclu_cat = [];
		pos = 1;
		columDatas['Categoría'].forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!cat_data.some(item => format_text(item.nombre) === format_text(element))) {
					cat_data.push({ nombre: element, detalle: element });
				}
			} else {
				exclu_cat.push({ posicion: pos + 1, categoria_invalida: "Categoria no valida [" + element + "]" });
			}
			pos++;
		});
		cat_data.forEach(element => {
			axios.post('/api/categorias/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Categorias terminado con exito'));
		// -------------- Fin de Guardar categorias -------------- //

		// -------------- Guardar Partidas -------------- //
		let par_data = [];
		let exclu_par = [];
		pos = 1;
		rowData.slice(1).forEach(element => {
			if (element[19] != undefined && element[19] != "" && element[19] != null && element[19] != "-") {
				if (!par_data.some(item => item.codigo === element[19])) {
					par_data.push({ codigo: element[19], descripcion: element[20] });
				}
			} else {
				exclu_par.push({ posicion: pos + 1, partida_invalida: "Partida no valida [" + element[19] + "]" });
			}
			pos++;
		});
		par_data.forEach(element => {
			axios.post('/api/partidas/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Partidas terminado con exito'));
		// -------------- Fin de Guardar Partidas -------------- //

		// -------------- Guardar Modelos -------------- //
		let mod_data = [];
		let exclu_mod = [];
		pos = 1;
		columDatas['Modelo'].forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!mod_data.some(item => format_text(item.nombre) === format_text(element))) {
					mod_data.push({ nombre: element });
				}
			} else {
				exclu_mod.push({ posicion: pos + 1, modelo_invalido: "Modelo no valido [" + element + "]" });
			}
			pos++;
		});
		mod_data.forEach(element => {
			axios.post('/api/modelos/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Modelos terminado con exito'));
		// -------------- Fin de Guardar Modelos -------------- //

		// -------------- Guardar Marcas -------------- //
		let mar_data = [];
		let exclu_mar = [];
		pos = 1;
		columDatas['Marca'].forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!mar_data.some(item => format_text(item.nombre) === format_text(element))) {
					mar_data.push({ nombre: element });
				}
			} else {
				exclu_mar.push({ posicion: pos + 1, marca_invalida: "Marca no valida [" + element + "]" });
			}
			pos++;
		});
		mar_data.forEach(element => {
			axios.post('/api/marcas/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Marcas terminado con exito'));
		// -------------- Fin de Guardar Marcas -------------- //

		// -------------- Guardar compras -------------- //
		let com_data = [];
		let exclu_com = [];
		pos = 1;
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
						exclu_com.push({ posicion: pos + 1, orden_compra_invalido: "Orden de compra no valido [" + numero_orden_compra + "]" });
					}
				}
				pos++;
			});
			com_data.forEach(element => {
				axios.post('/api/compra/', element, config).catch((err) => {
					console.log(err.response.data);
				});
			});
		}), console.log('Compras terminado con exito');
		// -------------- Fin de Guardar compras -------------- //

		// -------------- Guardar Red -------------- //
		let red_data = [];
		let exclu_red = [];
		pos = 1;
		if (red_data.length === 0) {
			red_data.push({ MAC: "No aplica", IP: "---", IP_switch: "---", IP6: "---" });
		}
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
			} else {
				exclu_red.push({ posicion: pos + 1, red_invalida: "Red no valida [" + element[40] + "]" });
			}
			pos++;
		});
		// verificar que acepte el valor Pendiente para casos de que aun no se defina
		red_data.forEach(element => {
			axios.post('/api/red/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}), console.log('Redes terminado con exito');
		// -------------- Fin de Guardar Red -------------- //

		// -------------- Guardar funcionarios -------------- //
		let fun_data = [];
		let exclu_fun = [];
		pos = 1;
		if (fun_data.length === 0) {
			fun_data.push({
				cedula: 'por definir', nombre_completo: 'por definir',
				correo_institucional: 'por_definir@gmail.com', correo_personal: 'por definir',
				telefono_oficina: tel_format('12345678'), telefono_personal: tel_format('12345678')
			});
		}
		// Combina las listas
		const fucionarList = [...columDatas['Custodio'], ...columDatas['Coordinador']];
		// Convierte a Set para eliminar duplicados y luego de vuelta a Array
		const custodios = [...new Set(fucionarList)];
		custodios.forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!fun_data.some(item => item.nombre === element)) {
					fun_data.push({
						cedula: 'por definir',
						nombre_completo: element.trim(),
						correo_institucional: element.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '@ucr.ac.cr', // Esto solo es para efecto de practica
						correo_personal: 'por definir',
						telefono_oficina: tel_format('12345678'),
						telefono_personal: tel_format('12345678'),
					});
				}
			} else {
				exclu_fun.push({ posicion: pos + 1, funcionario_invalido: "Funcionario no valido [" + element + "]" });
			}
			pos++;
		});
		fun_data.forEach(element => {
			axios.post('/api/funcionarios/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}), console.log('Funcionarios terminado con exito');
		// -------------- Fin de Guardar funcionarios -------------- //

		// -------------- Guardar Estados -------------- //
		let est_data = [];
		let exclu_est = [];
		pos = 1;
		columDatas['Estado'].forEach(element => {
			if (element != undefined && element != "" && element != null) {
				if (!est_data.some(item => format_text(item.nombre) === format_text(element))) {
					est_data.push({ nombre: element, descripcion: element });
				}
			} else {
				exclu_est.push({ posicion: pos + 1, estado_invalido: "Estado no valido [" + element + "]" });
			}
			pos++;
		});
		est_data.forEach(element => {
			axios.post('/api/estados/', element, config).catch((err) => {
				console.log(err.response.data);
			});
		}, console.log('Estados terminado con exito'));
		// -------------- Fin de Guardar Estados -------------- //

		// -------------- Guardar Unidad Universitaria -------------- //
		let uni_data = [];
		let exclu_uni = [];
		axios.get(`/api/funcionarios/`).then((response) => {
			const funcionarios_list = response.data;
			let coordinador_pending = funcionarios_list.find(funcionario => funcionario.nombre_completo === 'por definir');
			if (uni_data.length === 0) {
				uni_data.push({ codigo: "00000", nombre: "Sin unidad", coordinador: coordinador_pending.id });
			}

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
				} else {
					exclu_uni.push({ posicion: x + 1, unidad_invalida: "Unidad no valida [" + codigo + "]" });
				}
			}
			uni_data.forEach(element => {
				axios.post('/api/unidades/', element, config).catch((err) => {
					console.log(err.response.data);
				});
			});
		}), console.log('Unidades terminado con exito');
		// -------------- Fin de Guardar Unidad Universitaria -------------- //

		// -------------- Guardar Ubicaciones -------------- //
		let ubi_data = [];
		let exclu_ubi = [];
		setTimeout(() => {
			axios.get(`/api/instalaciones/`).then((response) => {
				const instalaciones_list = response.data;

				axios.get(`/api/funcionarios/`).then((response) => {
					const funcionarios_list = response.data;

					axios.get(`/api/unidades/`).then((response) => {
						const unidades_list = response.data;

						let coordinador_pending = funcionarios_list.find(funcionario => funcionario.nombre_completo === 'por definir');
						let unidad_pending = unidades_list.find(unidad => unidad.nombre === 'Sin unidad');
						if (ubi_data.length === 0) {
							ubi_data.push({ ubicacion: "Sin ubicación", instalacion: 1, custodio: coordinador_pending.id , unidades: unidad_pending.codigo });
						}

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
							} else {
								exclu_ubi.push({ posicion: x + 1, ubicacion_invalida: "Ubicacion no valida [" + ubicacion + "]" });
							}
						}
						ubi_data.forEach(element => {
							axios.post('/api/ubicaciones/', element, config).catch((err) => {
								console.log(err.response.data);
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
		let full_data = []; // Lista con todos los datos sin verificar
		let act_plac_data = []; // Lista con los valoes validos para enviar a la base de datos
		let exclu_act = [];
		setTimeout(() => {
			async function fetchData() {
				try {
					const urls = [
						'/api/tipo/',
						'/api/subtipos/',
						'/api/categorias/',
						'/api/estados/',
						'/api/marcas/',
						'/api/modelos/',
						'/api/red/',
						'/api/ubicaciones/',
						'/api/compra/',
					];
					const requests = urls.map(url => axios.get(url));
					const responses = await Promise.all(requests);
					const [tipo_list, subtipo_list, categoria_list, estado_list, marcas_list, modelos_list, red_list, ubicacion_list, compra_list] = responses.map(response => response.data);

					let red_pending = red_list.find(red => red.MAC.toLowerCase() === 'no aplica');
					let ubicacion_pending = ubicacion_list.find(ubicacion => ubicacion.ubicacion.toLowerCase() === 'sin ubicación');

					// Aquí puedes trabajar con las listas obtenidas
					for (let x = 1; x < rowData.length; x++) {
						let placa = rowData[x][0];
						let serie = rowData[x][7];
						let ubicacion_anterior = ubicacion_pending.id;
						let nombre = rowData[x][5] + " " + rowData[x][6];
						let tipo = rowData[x][3];
						let subtipo = rowData[x][4];
						let modelo = typeof rowData[x][6] === 'string' ? rowData[x][6].toLowerCase() : rowData[x][6];
						let marca = typeof rowData[x][5] === 'string' ? rowData[x][5].toLowerCase() : rowData[x][5];
						let valor_colones = floatClearValor(rowData[x][8]);
						let valor_dolares = floatClearValor(rowData[x][9]);
						let garantia = dateValidate(rowData[x][10]);
						let fecha_registro = dateValidate(rowData[x][34]);
						let fecha_ingreso = dateValidate(rowData[x][21]);
						let observacion = rowData[x][11];
						let categoria = rowData[x][2];
						let compra = rowData[x][22];
						let red = rowData[x][40] ? rowData[x][40] : null;
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

								// Agrega el id de la marca
								const marcaObj = marcas_list.find(item => item.nombre.toLowerCase() === marca);
								const id_marca = marcaObj ? marcaObj.id : -1;

								// Agrega el id del modelo
								const modeloObj = modelos_list.find(item => item.nombre.toLowerCase() === modelo);
								const id_modelo = modeloObj ? modeloObj.id : -1;

								// Agrega el id de la ubicacion
								const ubicacionObj = ubicacion_list.find(item => item.ubicacion === ubicacion);
								const id_ubicacion = ubicacionObj ? ubicacionObj.id : -1;

								// Agrega el id de la red
								const redObj = red_list.find(item => item.MAC === red);
								const id_red = redObj ? redObj.id : red_pending.id;

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
									subtipo: id_subtipo, modelo: id_modelo, marca: id_marca, valor_colones,
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
					if (full_data[s].modelo == null || full_data[s].modelo == undefined || full_data[s].modelo == "" || full_data[s].modelo == -1) {
						let addInfoData = exclu_act.find(item => item.posicion === s + 1);
						if (addInfoData) {
							addInfoData.modelo_invalido = "Modelo no valido";
						} else {
							exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, modelo_invalido: "Modelo no valido" });
						}
					}
					// Verifica si la marca es valida
					if (full_data[s].marca == null || full_data[s].marca == undefined || full_data[s].marca == "" || full_data[s].marca == -1) {
						let addInfoData = exclu_act.find(item => item.posicion === s + 1);
						if (addInfoData) {
							addInfoData.marca_invalida = "Marca no valida";
						} else {
							exclu_act.push({ posicion: s + 1, placa: full_data[s].placa, marca_invalida: "Marca no valida" });
						}
					}
					if (full_data[s].valor_colones >= 0.0 || full_data[s].valor_dolares >= 0.0) {
						// Al menos uno de los valores es mayor a 0.0, considerado válido
					} else {
						// Ambos valores son 0.0 o inválidos
						let addInfoData = exclu_act.find(item => item.posicion === s + 1);
						if (addInfoData) {
							addInfoData.valor_colones_invalido = "Valor en colones no valido";
							addInfoData.valor_dolares_invalido = "Valor en dólares no valido";
						} else {
							exclu_act.push({
								posicion: s + 1,
								placa: full_data[s].placa,
								valor_colones_invalido: "Valor en colones no valido",
								valor_dolares_invalido: "Valor en dólares no valido"
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
				act_plac_data.forEach(element => {
					axios.post('/api/activos_plaqueados/', element, config).catch((err) => {
						console.log(err.response.data);
					});
				}
				), console.log('Activos terminado con exito');
			}).then(() => {

				// Genera una lista con los errores encontrados 
				// para ser descargados como un archivo de excel
				informe_errores.push({
					'Informe tipos': exclu_tipo,
					'Informe subtipos': exclu_subtipo,
					'Informe proveedores': exclu_prov,
					'Informe categorias': exclu_cat,
					'Informe partidas': exclu_par,
					'Informe modelos': exclu_mod,
					'Informe marcas': exclu_mar,
					'Informe compras': exclu_com,
					'Informe redes': exclu_red,
					'Informe funcionarios': exclu_fun,
					'Informe estados': exclu_est,
					'Informe unidades': exclu_uni,
					'Informe ubicaciones': exclu_ubi,
					'Informe activos': exclu_act
				});
				console.log(informe_errores);

				// Llamar a la función para descargar el informe
				informeDeActivos(informe_errores);
				Swal.fire({
					icon: "success",
					title: "Datos cargados con éxito",
					text: "Se ha generado un informe con los datos no válidos",
				});
			});
		}, 9000);
		// -------------- Fin de Guardar Activos -------------- //
	};

	reader.readAsArrayBuffer(file);
});

//Los campos con 'pendientes' y fechas rebotan y se almacenan en un documento nuevo para su debida depuración [listo]
// Separar la importacion de los activos plaqueados y no plaqueados
// Crear una funcion para la actualización de los datos con el checkbox
// Crear una funcion para respaldar la base de datos manualmente 3 archivos

// En bodega o aun no se ha asignado una ubicación y sus relaciones como "Pendientes"
// "Sin información" para los campos que no se tiene los datos por antiguos
// 0.0 cuando no se conoce el precio del activo
// formato de fecha es YYYY-MM-DD - 2021-12-31
