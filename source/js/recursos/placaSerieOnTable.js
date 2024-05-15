
function placaNoExisteEnTabla(placa, table) {
    let rows = table.getData();
    return rows.every(row => row.placa !== placa);
}

function serieNoExisteEnTabla(serie, table) {
    let rows = table.getData();
    return rows.every(row => row.serie !== serie);
}

module.exports = { placaNoExisteEnTabla, serieNoExisteEnTabla }