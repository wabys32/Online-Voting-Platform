document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('.video-grid .row') || document.querySelector('.row.g-3');

    try {
        const res = await fetch('http://localhost:3000/api/polls/thumbs');
        const polls = await res.json();

        grid.innerHTML = '';

        polls.forEach(poll => {
            const col = document.createElement('div');
            col.className = 'col-6 col-md-4 col-lg-3';

            const link = document.createElement('a');
            link.href = `../vote/vote.html?pollId=${poll._id}`;
            link.className = 'card video-card position-relative overflow-hidden';

            link.innerHTML = `
                <div class="d-flex w-100 h-100">
                    <img src="${poll.option1.thumbData}" class="w-50 h-100 object-fit-cover" alt="${poll.option1.text}" loading="lazy">
                    <img src="${poll.option2.thumbData}" class="w-50 h-100 object-fit-cover" alt="${poll.option2.text}" loading="lazy">
                </div>
                <div class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center p-2 fw-bold">
                    ${poll.option1.text} VS ${poll.option2.text}
                </div>
            `;

            // // Optional: load full images only on hover (feels instant)
            // link.addEventListener('mouseenter', () => {
            //     const imgs = link.querySelectorAll('img');
            //     imgs[0].src = poll.option1.imageData || imgs[0].src; // fallback if not loaded yet
            //     imgs[1].src = poll.option2.imageData || imgs[1].src;
            // });

            col.appendChild(link);
            grid.appendChild(col);
        });
    } catch (err) {
        console.error('Failed to load polls:', err);
        grid.innerHTML = '<p class="text-center text-danger">Failed to load polls</p>';
    }
});