function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        .split('=')[1];
    console.log(1, cookieValue)
    return cookieValue;
}

module.exports = { getCSRFToken }