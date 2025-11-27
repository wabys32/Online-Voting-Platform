const userCredentialsContainer = document.getElementById('user-credentials')
const upload_page = document.getElementById("upload_page")
let user_email = null;
let user_name = null;
let user_nickname = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        console.log("No token found. User not logged in.");
        upload_page.innerHTML = '<p class="middle-text">User not logged in</p>';
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/auth/check", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.loggedIn) {
            console.log("Login success:", result.user.email, result.user.name, result.user.nickname);
            if (userCredentialsContainer)
                userCredentialsContainer.innerHTML = `<p class="username-container">@${result.user.nickname}</p><button class="btn btn-outline-primary me-2" type="button" onclick="logOff()">Log off</button>`
            user_email = result.user.email
            user_name = result.user.name
            user_nickname = result.user.nickname
            // Optional: Update UI to show logged-in state
            // e.g., document.getElementById("userEmail").textContent = result.user.email;
        } else {
            localStorage.removeItem("authToken");
            console.log("Invalid token. Logged out.");
            upload_page.innerHTML = '<p class="middle-text">User not logged in</p>';
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        upload_page.innerHTML = '<p class="middle-text">User not logged in</p>';
        localStorage.removeItem("authToken");
    }
});


function logOff() {
    localStorage.removeItem('authToken')
    window.location.reload();
}