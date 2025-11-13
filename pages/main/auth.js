const userCredentialsContainer = document.getElementById('user-credentials')

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        console.log("No token found. User not logged in.");
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
            userCredentialsContainer.innerHTML = `<p class="username-container">@${result.user.nickname}</p><button class="btn btn-outline-primary me-2" type="button" onclick="logOff()">Log off</button>`
            // Optional: Update UI to show logged-in state
            // e.g., document.getElementById("userEmail").textContent = result.user.email;
        } else {
            localStorage.removeItem("authToken");
            console.log("Invalid token. Logged out.");
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("authToken");
    }
});


function logOff(){
    localStorage.removeItem('authToken')
    window.location.reload();
}