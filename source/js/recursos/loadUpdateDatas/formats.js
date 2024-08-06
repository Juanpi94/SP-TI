
// Función para formatear el texto
function format_text(text) {
	// Elimina los acentos y convierte a minúsculas
	if (text === null || text === undefined || text === "") {
		return text;
	}
	// Si el texto no es una cadena, conviértelo a cadena
	if (typeof text !== "string") {
		text = text.toString();
	}
	// Elimina los espacios en blanco y los acentos
	return text.replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Función para validar y formatear números de teléfono
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

// Función para validar y formatear fechas
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

// Función para limpiar los valores y convertirlos a flotante
function floatClearValor(value) {
	// Filtrar NaN
	if (isNaN(value)) {
		return "0.00";
	}

	// Convertir a cadena y eliminar caracteres no numéricos excepto el punto
	value = value.toString().replace(/[^\d.]/g, '');

	// Verificar si contiene un punto decimal
	if (!value.includes('.')) {
		value += '.00';
	} else {
		// Asegurarse de que haya dos dígitos después del punto decimal
		let parts = value.split('.');
		if (parts[1].length === 0) {
			value += '00';
		} else if (parts[1].length === 1) {
			value += '0';
		}
	}

	return value;
}

function validateType(arg) {
	if (arg === null || arg === undefined || arg === NaN || arg === "NaN") {
		return false;
	}

	arg = String(arg).trim().toLowerCase();
	if (arg === "pendiente" || arg === "s/p" || arg === "" || arg === "-") {
		return false;
	}
	return true;
}

export { format_text, tel_format, dateValidate, floatClearValor, validateType };