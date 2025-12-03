// Full new vote.js file (create this file)
const userCredentialsContainer = document.getElementById('user-credentials')
const upload_page = document.getElementById("upload_page")
let user_email = null;
let user_name = null;
let user_nickname = null;

document.addEventListener('DOMContentLoaded', async () => {
    /// SECTION, MOVED FROM AUTH.JS
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
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("authToken");
    }



    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('pollId');
    if (!pollId) {
        // Replaced alert with console log/error as per instructions
        console.error('No poll ID found');
        return;
    }

    const image1 = document.getElementById('image1');
    const image2 = document.getElementById('image2');
    const btn1 = document.getElementById('btn1');
    const btn2 = document.getElementById('btn2');
    const option1Text = document.getElementById('option1-text');
    const option2Text = document.getElementById('option2-text');
    const percentage1Text = document.getElementById('percentage1-text');
    const percentage2Text = document.getElementById('percentage2-text');
    const totalVotesText = document.getElementById('totalVotes');

    const loadingScreen = document.getElementById('loading-screen');
    const optionButtons = document.getElementsByClassName('option-button');

    // Get contrast color for text
    function getContrastColor(rgbColor) {
        // Extract R, G, B values from the "rgb(r, g, b)" string
        const match = rgbColor.match(/\d+/g);
        if (!match || match.length < 3) return '#000000'; // Default to black if parsing fails

        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);

        // Calculate luminance using the standard formula (weighted average)
        // Values: R=0.299, G=0.587, B=0.114 (used for perceived brightness/luma)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

        // A common threshold for light/dark is 128 (out of 255)
        const threshold = 180; // Adjusted higher since your colors are boosted

        // If the color is light (luminance > threshold), use black text. Otherwise, use white text.
        return luminance > threshold ? '#000000' : '#ffffff';
    }

    // Fetch and display poll
    async function loadPoll() {
        try {
            const res = await fetch(`http://localhost:3000/api/polls/${pollId}`);
            const poll = await res.json();

            image1.src = poll.option1.imageData;
            image2.src = poll.option2.imageData;
            option1Text.textContent = poll.option1.text;
            option2Text.textContent = poll.option2.text;

            let totalVotes = poll.option1Votes + poll.option2Votes;
            let option1Percentage = 0.0, option2Percentage = 0.0;

            if (totalVotes != 0) {
                option1Percentage = poll.option1Votes / totalVotes;
                option2Percentage = poll.option2Votes / totalVotes;
                option1Percentage *= 100;
                option2Percentage *= 100;
            } else {
                option1Percentage = 0;
                option2Percentage = 0;
            }

            percentage1Text.textContent = `${option1Percentage.toFixed(1)}%`;
            percentage2Text.textContent = `${option2Percentage.toFixed(1)}%`;
            totalVotesText.textContent = `Total Votes: ${totalVotes}`;

            // Check if already voted (requires server to expose votedUsers, but for privacy, better to check on vote)
            // For now, attempt vote and handle error
        } catch (err) {
            console.error('Failed to load poll:', err);
        }
    }

    async function checkIfVoted() {
        const currentToken = localStorage.getItem("authToken");

        if (!currentToken || !user_nickname) {
            console.log("Nickname not yet available or user not logged in.");
            return;
        }

        try {
            // Use the global user_nickname
            const res = await fetch(`http://localhost:3000/api/polls/${pollId}/checkvote?nickname=${user_nickname}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            // 1. Check for non-successful HTTP status (4xx, 5xx) first
            if (!res.ok) {
                // Handle API errors like 401, 400, 404, 500
                console.error("Failed to check vote status:", res.status, await res.text());
                return; // Exit the function or handle the error
            }

            // 2. Parse the JSON response body
            const data = await res.json();
            const hasVoted = data.voted; // The key variable we want to receive
            const userOption = data.option; // Capture the user's previously selected option

            // 3. Use the 'hasVoted' variable to determine the UI state
            if (hasVoted) {
                console.log("User has already voted (VOTED: true)");
                console.log(`User previously voted for option: ${userOption}`);

                // Highlight the user's previously selected option
                if (userOption === 1) {
                    // Assuming 'voted-highlight' is a CSS class to visually indicate the selection
                    btn1.classList.add('voted-highlight');
                } else if (userOption === 2) {
                    btn2.classList.add('voted-highlight');
                }

                showResultsAnimation();
                btn1.disabled = true;
                btn2.disabled = true;
            } else {
                console.log("User hasn't voted yet (VOTED: false)");
            }

        } catch (err) {
            console.error("An error occurred during fetch:", err);
        }
    }

    await checkIfVoted();

    await loadPoll();

    const color1 = getAverageColorFromImage(image1);
    const color2 = getAverageColorFromImage(image2);
    btn1.style.setProperty('background-color', color2, 'important');
    btn2.style.setProperty('background-color', color1, 'important');
    console.log(color1, color2);

    // Apply contrast color
    const contrastColor1 = getContrastColor(color1); // Text color for image1's side (btn2)
    const contrastColor2 = getContrastColor(color2); // Text color for image2's side (btn1)

    // Option 1 (Text/Percentage 1) is on the left side, which uses the background color from image2 (color2)
    option1Text.style.setProperty('color', contrastColor2, 'important');
    percentage1Text.style.setProperty('color', contrastColor2, 'important');

    // Option 2 (Text/Percentage 2) is on the right side, which uses the background color from image1 (color1)
    option2Text.style.setProperty('color', contrastColor1, 'important');
    percentage2Text.style.setProperty('color', contrastColor1, 'important');

    // Assuming totalVotesText is centered and needs high contrast against the dominant background
    // You might need to adjust this depending on its placement. For now, use the color of btn1's background (color2)
    totalVotesText.style.setProperty('color', contrastColor2, 'important');


    // showResultsAnimation();

    loadingScreen.style.setProperty('display', 'none', 'important');
    totalVotes.style.setProperty('display', 'block');
    for (let i = 0; i < optionButtons.length; i++) {
        optionButtons[i].style.setProperty('display', 'inline-block', 'important');
    }

    // Vote handlers
    btn1.addEventListener('click', async () => vote(1));
    btn2.addEventListener('click', async () => vote(2));

    async function vote(option) {
        if (!token || !user_nickname) {
            // Replaced alert with console log/error as per instructions
            console.error('Please login to vote');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/polls/${pollId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ option, userNickname: user_nickname })
            });

            if (!res.ok) {
                const err = await res.json();
                // Replaced alert with console log/error as per instructions
                console.error('Vote failed:', err.error || 'Unknown error');
                return;
            }

            const { option1Votes, option2Votes } = await res.json();


            let totalVotes = option1Votes + option2Votes;
            let option1Percentage, option2Percentage;
            if (totalVotes != 0) {
                option1Percentage = option1Votes / totalVotes;
                option2Percentage = option2Votes / totalVotes;
                option1Percentage *= 100;
                option2Percentage *= 100;
            } else {
                option1Percentage = 0;
                option2Percentage = 0;
            }

            percentage1Text.textContent = `${option1Percentage.toFixed(1)}%`;
            percentage2Text.textContent = `${option2Percentage.toFixed(1)}%`;
            totalVotesText.textContent = `Total Votes: ${totalVotes}`;

            // Highlight the newly cast vote
            if (option === 1) {
                btn1.classList.add('voted-highlight');
            } else if (option === 2) {
                btn2.classList.add('voted-highlight');
            }

            // Disable buttons after vote
            btn1.disabled = true;
            btn2.disabled = true;
        } catch (err) {
            // Replaced alert with console log/error as per instructions
            console.error('Vote error:', err.message);
        }
    }
});


function getAverageColorFromImage(imgElement) {
    const BRIGHTNESS_BOOST = 100;

    if (!imgElement.complete || imgElement.naturalWidth === 0) {
        console.error("Image must be fully loaded before calling getAverageColorFromImage.");
        return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = imgElement.naturalWidth;
    const height = imgElement.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    try {
        // 2. Draw the image onto the canvas
        ctx.drawImage(imgElement, 0, 0, width, height);

        let redSum = 0;
        let greenSum = 0;
        let blueSum = 0;
        let pixelCount = 0;

        // 3. Get the pixel data (will throw error for cross-origin images without CORS headers)
        const imageData = ctx.getImageData(0, 0, width, height).data;

        // 4. Iterate over pixel data (4 elements per pixel: R, G, B, A)
        for (let i = 0; i < imageData.length; i += 4) {
            const alpha = imageData[i + 3]; // Alpha channel

            // Skip transparent pixels (alpha = 0)
            if (alpha > 0) {
                redSum += imageData[i];     // Red
                greenSum += imageData[i + 1]; // Green
                blueSum += imageData[i + 2];  // Blue
                pixelCount++;
            }
        }

        if (pixelCount > 0) {
            const avgR = Math.round(redSum / pixelCount);
            const avgG = Math.round(greenSum / pixelCount);
            const avgB = Math.round(blueSum / pixelCount);

            // 5. Apply the brightness boost
            const boost = (component, offset) => {
                return Math.min(255, component + offset);
            };

            const boostedR = boost(avgR, BRIGHTNESS_BOOST);
            const boostedG = boost(avgG, BRIGHTNESS_BOOST);
            const boostedB = boost(avgB, BRIGHTNESS_BOOST);

            // ------------------------------------

            return `rgb(${boostedR}, ${boostedG}, ${boostedB})`;
        } else {
            console.warn("No non-transparent pixels found in image data.");
            return null;
        }
    } catch (e) {
        console.error("Could not process image data. Check for CORS issues if images are remote.", e);
        return null;
    }
}