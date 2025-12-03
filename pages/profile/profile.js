let user_email = null;
let user_name = null;
let user_nickname = null;
const userCredentialsContainer = document.getElementById('user-credentials')


document.addEventListener('DOMContentLoaded', async () => {
    /// ===============================
    /// SCRIPT MOVED FROM AUTH.JS
    /// ===============================
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
    // ====================================
    /// END OF AUTH.JS PART
    // ====================================
    const emailField = document.getElementById("emailField");
    const nicknameField = document.getElementById("nicknameField");
    const nameField = document.getElementById("nameField");
    emailField.textContent = `Email: ${user_email}`;
    nicknameField.textContent = `Nickname: @${user_nickname}`;
    nameField.textContent = `Name: ${user_name}`;


    // 1. Get user nickname from the stored user data
    const user = JSON.parse(localStorage.getItem('currentUser'));

    // Element to display the user's nickname
    const profileNicknameElement = document.getElementById('profileNickname');
    if (profileNicknameElement && user_nickname) {
        profileNicknameElement.textContent = user_nickname;
    } else if (profileNicknameElement) {
        profileNicknameElement.textContent = 'Guest';
    }


    const grid = document.querySelector('.video-grid .row') || document.querySelector('.row.g-3');

    if (!user_nickname) {
        grid.innerHTML = '<p class="text-center text-danger">You must be logged in to view your profile polls.</p>';
        return;
    }

    try {
        // 2. MODIFIED ENDPOINT CALL: Append the nickname as a query parameter
        const endpoint = `http://localhost:3000/api/polls/light?nickname=${user_nickname}`;
        const res = await fetch(endpoint);
        const polls = await res.json();

        grid.innerHTML = '';

        if (polls.length === 0) {
            grid.innerHTML = '<p class="text-center text-muted">You haven\'t created any polls yet.</p>';
            return;
        }

        polls.forEach(poll => {
            const col = document.createElement('div');
            col.className = 'col-6 col-md-4 col-lg-3';

            const link = document.createElement('a');
            link.href = `../vote/vote.html?pollId=${poll._id}`;
            link.className = 'card video-card position-relative overflow-hidden';

            // Placeholder (gray split + text)
            link.innerHTML = `
                <div class="d-flex w-100 h-100">
                    <div class="w-50 h-100 bg-secondary"></div>
                    <div class="w-50 h-100 bg-secondary"></div>
                </div>
                <div class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center p-2 fw-bold">
                    ${poll.option1.text} VS ${poll.option2.text}
                </div>
            `;

            // Lazy load thumbnails when card visible
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetch(`http://localhost:3000/api/polls/${poll._id}/thumbs`)
                        .then(r => r.json())
                        .then(thumbs => {
                            link.innerHTML = `
                                <div class="d-flex w-100 h-100">
                                    <img src="${thumbs.option1.thumbData}" class="w-50 h-100 object-fit-cover" alt="${poll.option1.text}" loading="lazy">
                                    <img src="${thumbs.option2.thumbData}" class="w-50 h-100 object-fit-cover" alt="${poll.option2.text}" loading="lazy">
                                </div>
                                <div class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center p-2 fw-bold">
                                    ${poll.option1.text} VS ${poll.option2.text}
                                </div>
                            `;
                        })
                        .catch(err => console.error('Failed to load thumbs for poll:', poll._id, err));
                    observer.unobserve(link);
                }
            }, { rootMargin: '100px' }); // Preload a bit early

            observer.observe(link);

            col.appendChild(link);
            grid.appendChild(col);
        });
    }
    catch (err) {
        console.error('Failed to load polls:', err);
        grid.innerHTML = '<p class="text-center text-danger">Failed to load polls</p>';
    }
});



// Function to filter the polls based on search input
function filterPolls() {
    // Get the search input value and convert to lowercase for case-insensitive search
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();

    // Get the container where the poll cards are
    const pollsContainer = document.getElementById('pollsContainer');

    // Get all the direct children of the container, which are the poll columns (e.g., <div class="col-6 col-md-4 col-lg-3">)
    const pollContainers = pollsContainer.children;

    // Loop through each poll container
    for (let i = 0; i < pollContainers.length; i++) {
        const pollContainer = pollContainers[i];

        // Target the element that holds the poll title (the one with the text "Travel by plane VS Travel by car")
        const titleElement = pollContainer.querySelector('.position-absolute.bottom-0.start-0.end-0');

        if (titleElement) {
            // Get the title text and convert to lowercase
            const pollTitle = titleElement.textContent.trim().toLowerCase();

            // Check if the poll title includes the search term
            if (pollTitle.includes(searchTerm)) {
                // If it matches, show the poll container
                pollContainer.style.display = 'block';
            } else {
                // If it doesn't match, hide the poll container
                pollContainer.style.display = 'none';
            }
        }
    }
}

// Add event listener to the search input
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // 'keyup' is a good event for live searching
        searchInput.addEventListener('keyup', filterPolls);
        // Prevent form submission on search (to avoid a page reload)
        searchInput.closest('form').addEventListener('submit', function (e) {
            e.preventDefault();
        });
    }
});

// The rest of your main.js code (like the poll injection logic) should follow or precede this.