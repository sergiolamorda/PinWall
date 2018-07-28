window.onload = () => {
    var entrarLink = document.getElementById('entraLink'),
        registrateLink = document.getElementById('registrateLink'),
        loginContainer = document.getElementById('loginContainer'),
        signupContainer = document.getElementById('signupContainer');

    entraLink.addEventListener('click', () => {
        loginContainer.style.display = 'grid';
        signupContainer.style.display = 'none';
    });
    registrateLink.addEventListener('click', evt => {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'grid';
    });
}
