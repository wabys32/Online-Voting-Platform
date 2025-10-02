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