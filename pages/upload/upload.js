const imageInput1 = document.getElementById('imageInput1');
const imageInput2 = document.getElementById('imageInput2');
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const textInput1 = document.getElementById('textInput1');
const textInput2 = document.getElementById('textInput2');
const uploadBtn = document.getElementById('uploadBtn');
const status = document.getElementById('status');

let file1 = null, file2 = null;

// Preview + compress image 1
imageInput1.addEventListener('change', (e) => {
    file1 = e.target.files[0];

    if (file1 && file1.type !== 'image/png') {
        alert('Only PNG files are allowed!');
        imageInput1.value = '';
        preview1.src = '';
        preview1.style.display = 'none';
        file1 = null;
        return;
    }

    if (file1) compressAndPreview(file1, preview1,
        (full) => file1.fullBase64 = full,
        (thumb) => file1.thumbBase64 = thumb
    );
});

// Preview + compress image 2
imageInput2.addEventListener('change', (e) => {
    file2 = e.target.files[0];

    if (file2 && file2.type !== 'image/png') {
        alert('Only PNG files are allowed!');
        imageInput2.value = '';
        preview2.src = '';
        preview2.style.display = 'none';
        file2 = null;
        return;
    }

    if (file2) compressAndPreview(file2, preview2,
        (full) => file2.fullBase64 = full,
        (thumb) => file2.thumbBase64 = thumb
    );
});

// Compress function
function compressAndPreview(file, previewEl, callbackFull, callbackThumb) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX = 800;
            let w = img.width, h = img.height;
            if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
            else if (h > MAX) { w *= MAX / h; h = MAX; }

            canvas.width = w; canvas.height = h;
            if (w > h) {
                console.log("w > h");
                let difference = canvas.width - canvas.height;
                canvas.height += difference;
                canvas.offsetHeight -= difference / 2;
                ctx.drawImage(img, 0, difference / 2, w, h);
            } else {
                console.log("h <= w");
                let difference = canvas.height - canvas.width;
                canvas.width += difference;
                canvas.offsetWidth -= difference / 2
                ctx.drawImage(img, difference / 2, 0, w, h);
            }
            
            const fullBase64 = canvas.toDataURL('image/png');

            // 2. Tiny thumbnail 100×100, super low quality
            canvas.width = 100;
            canvas.height = 100;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, 100, 100);
            const thumbBase64 = canvas.toDataURL('image/png', 0.3); // tiny + ugly = super small

            previewEl.src = fullBase64;
            previewEl.style.display = 'block';
            
            callbackFull(fullBase64);
            callbackThumb(thumbBase64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Upload both
uploadBtn.addEventListener('click', async () => {
    if (!file1?.fullBase64 || !file2?.fullBase64) {
        status.textContent = "Please upload and process both images!";
        status.style.color = "red";
        return;
    }
    if (!textInput1.value.trim() || !textInput2.value.trim()) {
        status.textContent = "Please enter text for both images!";
        status.style.color = "red";
        return;
    }

    status.textContent = "Uploading...";
    status.style.color = "blue";

    const user = getUserFromToken();
    const nickname = user?.nickname || "anonymous";

    const payload = {
        option1: {
            imageData: file1.fullBase64,
            thumbData: file1.thumbBase64,        // ← NEW
            filename: file1.name.replace(/\.[^/.]+$/, "") + ".png",
            contentType: "image/png",
            text: textInput1.value.trim()
        },
        option2: {
            imageData: file2.fullBase64,
            thumbData: file2.thumbBase64,        // ← NEW
            filename: file2.name.replace(/\.[^/.]+$/, "") + ".png",
            contentType: "image/png",
            text: textInput2.value.trim()
        },
        nickname
    };

    try {
        const response = await fetch('http://localhost:3000/api/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            status.textContent = "Poll uploaded successfully!";
            status.style.color = "green";
        } else {
            status.textContent = "Error: " + (result.error || "Upload failed");
            status.style.color = "red";
        }
    } catch (err) {
        status.textContent = "Error: " + err.message;
        status.style.color = "red";
    }
});

function getUserFromToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { nickname: payload.nickname };
    } catch {
        return null;
    }
}