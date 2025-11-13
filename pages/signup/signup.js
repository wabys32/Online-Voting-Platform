(function() {
    emailjs.init("dN45tJbtQKq3pLX5j");
})();

const nameField = document.getElementById("name")
const emailField = document.getElementById("email")
const passwordField = document.getElementById("password")
const nicknameField = document.getElementById("nickname")
const confirmationCodeForm = document.getElementById("email-code-form")
const confirmationCodeField = document.getElementById("email-code")
const submitButton = document.getElementById("submitButton")

document.getElementById("userForm").addEventListener("submit", function (e) {
    e.preventDefault()

    if (!sentCode){
        // check if email already exists
        // const email_available = isEmailAvailable(email);
        checkUserExistence();


        
    }else{
        if (confirmationCodeField.value == confirmationCode){
            setTimeout(function () {
                submitButton.innerHTML = '<i class="bi bi-check-circle-fill"></i>'
            }, 400);
            setTimeout(function () {
                submitButton.innerHTML = 'Sign up'
            }, 1600);
            submitButton.classList.add("animate-green")
            setTimeout(function () {
                submitButton.classList.remove("animate-green")
                submitButton.innerHTML = 'Sign up'
            }, 2000);

            addUser()
        } else {
            setTimeout(function () {
                submitButton.innerHTML = '<i class="bi bi-x-octagon-fill"></i>'
            }, 400);
            setTimeout(function () {
                submitButton.innerHTML = 'Sign up'
            }, 1600);
            
            submitButton.classList.add("animate-red")
            setTimeout(function () {
                submitButton.classList.remove("animate-red")
                submitButton.innerHTML = 'Sign up'
            }, 2000);
            console.log("wrong code")
        }
    }
    
    // addUser()
})


var confirmationCode = null
var sentCode = false
function sendEmail(){
    confirmationCode = generateConfirmationCode(5)
    console.log(confirmationCode)
    // send confirmation code email
    // emailjs.send('service_ze2vv6h', 'template_yf7ehcq', {
    //     name: nameField.value,
    //     email: emailField.value,
    //     passcode: confirmationCode
    // });
    confirmationCodeForm.classList.remove("d-none")
    submitButton.innerHTML = "Sign up"
    sentCode = true
    createAlert('Confirm your email', '', 'Confirmation code was sent to your email', 'info', false, true, 'pageMessages');
}


// Add new user via API
async function addUser() {
    const userData = {
        name: nameField.value,
        nickname: nicknameField.value,
        email: emailField.value,
        password: passwordField.value
    };

    try {
        const response = await fetch("http://localhost:3000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Server error");

        // Store token on success
        localStorage.setItem("authToken", result.token);

        // console.log("User added:", result);
        // alert("✅ User added successfully!");
        // redirect to main page
        setTimeout(function(){
            window.location = "../main/main.html"
        }, 1000);
    } catch (error) {
        console.error("Error adding user:", error);
        alert("Signup failed: " + error.message);
    }
}



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


function generateConfirmationCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
    }
    return result;
}

async function checkUserExistence(){

    const userData = {
        nickname: nicknameField.value,
        email: emailField.value,
    };

    try {
        const response = await fetch("http://localhost:3000/api/users/checkuser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        // Parse JSON body
        const result = await response.json();

        // Now you can access the fields
        // console.log("Email found?", result.emailFound);
        // console.log("Nickname found?", result.nicknameFound);

        if (result.emailFound)
            setEmailInvalid(true);
        else
            setEmailInvalid(false);
        if (result.nicknameFound)
            setNicknameInvalid(true);
        else
            setNicknameInvalid(false);

        if (!result.emailFound && !result.nicknameFound){
            sendEmail();
        }
    } catch (err) {
        console.error("Error checking user:", err);
        alert("Server connection error. Try again.");
    }
}


function setNicknameInvalid(invalid) {
    const field = document.getElementById('nicknameField');
    if (!field) return;

    const label = field.querySelector('label');
    const span  = field.querySelector('.input-group-text');
    const input = field.querySelector('#nickname');

    // label
    if (label) {
        invalid ? label.classList.add('text-danger')
                : label.classList.remove('text-danger');
    }

    // @‑span
    if (span) {
        invalid ? span.classList.add('text-danger')
                : span.classList.remove('text-danger');
    }

    // input
    if (input) {
        invalid ? input.classList.add('is-invalid')
                : input.classList.remove('is-invalid');
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