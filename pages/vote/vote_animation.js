(function () {
    const DURATION_PROP = '--ripple-duration';


    function createRipple(event) {
        const el = event.currentTarget;
        if (event.button && event.button !== 0) return;


        const rect = el.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;


        const distX = Math.max(localX, rect.width - localX);
        const distY = Math.max(localY, rect.height - localY);
        const radius = Math.sqrt(distX * distX + distY * distY);
        const size = Math.ceil(radius * 2);


        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (localX - size / 2) + 'px';
        ripple.style.top = (localY - size / 2) + 'px';


        const colorAttr = el.getAttribute('data-ripple-color');
        if (colorAttr) {
            ripple.style.background = colorAttr;
        }


        const cssDuration = getComputedStyle(el).getPropertyValue(DURATION_PROP).trim() || getComputedStyle(document.documentElement).getPropertyValue(DURATION_PROP).trim() || '600ms';


        el.appendChild(ripple);
        void ripple.offsetWidth;
        ripple.classList.add('ripple--animate');


        const remove = () => { if (ripple && ripple.parentNode) ripple.parentNode.removeChild(ripple); };
        ripple.addEventListener('animationend', () => remove(), { once: true });


        const ms = parseFloat(cssDuration) * (cssDuration.includes('ms') ? 1 : 1000);
        setTimeout(remove, (isNaN(ms) ? 700 : ms + 50));
    }


    function attachToButtons(root = document) {
        root.querySelectorAll('.btn').forEach(btn => {
            if (btn.__rippleAttached) return;
            btn.addEventListener('pointerdown', createRipple);
            btn.__rippleAttached = true;
        });
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => attachToButtons());
    } else attachToButtons();
})();


let hasVoted = false;

// Function to apply the animation
function showResultsAnimation() {
    if (hasVoted) {
        console.log("Animation already visible.");
        return;
    }

    // Set the state to true to prevent re-triggering
    hasVoted = true;

    // Get the elements
    const option1Text = document.getElementById('option1-text');
    const option2Text = document.getElementById('option2-text');
    const percentage1Text = document.getElementById('percentage1-text');
    const percentage2Text = document.getElementById('percentage2-text');
    const btn1 = document.getElementById('btn1');
    const btn2 = document.getElementById('btn2');
    const totalVotes = document.getElementById('totalVotes');

    setTimeout(() => {
        option1Text.classList.add('voted');
        option2Text.classList.add('voted');
        btn1.classList.add('voted');
        btn2.classList.add('voted');
        totalVotes.classList.add('voted');
    }, 10);
    
    setTimeout(() => {
        percentage1Text.classList.add('voted');
        percentage2Text.classList.add('voted');
    }, 20);
    
    btn1.style.setProperty('pointer-events', 'none');
    btn2.style.setProperty('pointer-events', 'none');
}

document.getElementById('btn1').addEventListener('click', function(event) {
    console.log("Option 1 Voted!");
    showResultsAnimation();
});

document.getElementById('btn2').addEventListener('click', function(event) {
    console.log("Option 2 Voted!");
    showResultsAnimation();
});