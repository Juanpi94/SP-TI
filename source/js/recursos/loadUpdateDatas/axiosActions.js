import axios from 'axios';

// ------------------------ Configuraciones ------------------------ //
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
// ------------------------ Fin de configuraciones ------------------------ //

// ------------------------ Ajustes de Axios ------------------------ //
function axiosPost(endpoint, data) {
    axios.post('/api/' + endpoint + '/', data, config).catch((err) => {
        console.log(err.response.data);
    });
}

function axiosPut(endpoint, id, data) {
    axios.put(`/api/${endpoint}/${id}/`, data, config).catch((err) => {
        console.log(err.response.data);
    });
}

async function axiosGetAll(endpoint, item = '') {
    const list = [];
    try {
        const response = await axios.get(`/api/${endpoint}/${item}`, config);
        response.data.forEach(element => {
            list.push(element);
        });
    } catch (err) {
        console.log(err.response);
    }
    return list;
}

async function axiosGetOne(endpoint, reference, item = '') {
    let resp = {};
    try {
        const response = await axios.get(`/api/${endpoint}/${reference}/${item}`);
        resp = response.data[0];
    } catch (err) {
        console.log(err.response);
        resp = null;
    }
    return resp;
}
// ------------------------ Fin de Ajustes de Axios ------------------------ //

// ------------------------ Publicaciones de axios ------------------------ //
function postDatas(endpoint, listDatas) {
    if (listDatas.length === 0) {
        console.log(`No hay ${endpoint} nuevos para cargar`);
        return;
    }
    listDatas.forEach(element => {
        axiosPost(endpoint, element);
    }, console.log(endpoint + ' cargados con éxito'));
}

// ------------------------ Fin de Publicaciones de axios ------------------------ //

export { postDatas, axiosPut, axiosGetAll, axiosGetOne };