document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('.video-grid .row') || document.querySelector('.row.g-3');

    try {
    const res = await fetch('http://localhost:3000/api/polls/light');
    const polls = await res.json();

    grid.innerHTML = '';

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
    // Note: The structure is: <div class="col-*"> -> <a>. We need the parent div to show/hide the poll
    const pollContainers = pollsContainer.children; 

    // Loop through each poll container
    for (let i = 0; i < pollContainers.length; i++) {
        const pollContainer = pollContainers[i];
        
        // Target the element that holds the poll title (the one with the text "Travel by plane VS Travel by car")
        // It's the <div> inside the <a> with class "position-absolute bottom-0..."
        const titleElement = pollContainer.querySelector('.position-absolute.bottom-0.start-0.end-0');

        if (titleElement) {
            // Get the title text and convert to lowercase
            const pollTitle = titleElement.textContent.trim().toLowerCase();
            
            // Check if the poll title includes the search term
            if (pollTitle.includes(searchTerm)) {
                // If it matches, show the poll container
                pollContainer.style.display = 'block'; // 'block' or whatever the default display style is for a Bootstrap column
            } else {
                // If it doesn't match, hide the poll container
                pollContainer.style.display = 'none';
            }
        }
        // If no title element is found, it's best to keep it visible, assuming it's not a standard poll
    }
}

// Add event listener to the search input
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // 'keyup' is a good event for live searching
        searchInput.addEventListener('keyup', filterPolls);
        // Prevent form submission on search (to avoid a page reload)
        searchInput.closest('form').addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
});

// The rest of your main.js code (like the poll injection logic) should follow or precede this.