(function() {
    emailjs.init("dN45tJbtQKq3pLX5j");
})();

const emailField = document.getElementById("email")
const passwordField = document.getElementById("password")
const submitButton = document.getElementById("submitButton")

document.getElementById("userForm").addEventListener("submit", function (e) {
    e.preventDefault()

    checkUserLoginCredentials();

    // if (!sentCode){
    //     // check if email already exists
    //     // const email_available = isEmailAvailable(email);
})

const eyeIcon = document.getElementById("eye-icon")

function showHidePassword(){
    if (passwordField.getAttribute("type") == "password"){
        passwordField.setAttribute("type", "text")
        eyeIcon.classList.remove("bi-eye-slash")
        eyeIcon.classList.add("bi-eye")
    }else{
        passwordField.setAttribute("type", "password")
        eyeIcon.classList.remove("bi-eye")
        eyeIcon.classList.add("bi-eye-slash")
    }
}


async function checkUserLoginCredentials(){

    const userData = {
        email: emailField.value,
        password: passwordField.value
    };

    try {
        const response = await fetch("http://localhost:3000/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        // Parse JSON body
        const result = await response.json();

        // console.log("User found: ", result.userFound)
        // console.log("Password valid: ", result.passwordMatched)

        if (!result.success){
            if (!result.userFound)
                setEmailInvalid(true);
            else
                setEmailInvalid(false);

            if (!result.passwordMatched && result.userFound)
                setPasswordInvalid(true);
            else
                setPasswordInvalid(false);
        }

        if (result.success) {
            localStorage.setItem("authToken", result.token);

            setEmailInvalid(false);
            setPasswordInvalid(false);

            // Play animation
            setTimeout(function () {
                submitButton.innerHTML = '<i class="bi bi-check-circle-fill"></i>'
            }, 400);
            setTimeout(function () {
                submitButton.innerHTML = 'Log in'
            }, 1600);
            submitButton.classList.add("animate-green")
            setTimeout(function () {
                submitButton.classList.remove("animate-green")
                submitButton.innerHTML = 'Log in'
            }, 2000);

            setTimeout(() => {
                window.location = "../main/main.html";
            }, 1000);
        }else{
            setTimeout(function () {
                submitButton.innerHTML = '<i class="bi bi-x-octagon-fill"></i>'
            }, 400);
            setTimeout(function () {
                submitButton.innerHTML = 'Log in'
            }, 1600);
            
            submitButton.classList.add("animate-red")
            setTimeout(function () {
                submitButton.classList.remove("animate-red")
                submitButton.innerHTML = 'Log in'
            }, 2000);
        }

    } catch (err) {
        console.error("Error checking user:", err);
        alert("Server connection error. Try again.");
    }
}


function setEmailInvalid(invalid) {
    const field = document.getElementById('emailField');
    if (!field) return;

    const label = field.querySelector('label');
    const input = field.querySelector('#email');

    // label
    if (label) {
        invalid ? label.classList.add('text-danger')
                : label.classList.remove('text-danger');
    }

    // input
    if (input) {
        invalid ? input.classList.add('is-invalid')
                : input.classList.remove('is-invalid');
    }
}

function setPasswordInvalid(invalid) {
    const field = document.getElementById('passwordField');
    if (!field) return;

    const label = field.querySelector('label');
    const input = field.querySelector('#password');

    const action = invalid ? 'add' : 'remove';

    if (label) label.classList[action]('text-danger');
    if (input) input.classList[action]('is-invalid');
}