

function logOff() {
    localStorage.removeItem('authToken')
    window.location.reload();
}

