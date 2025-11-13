const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const uploadBtn = document.getElementById('uploadBtn');
const status = document.getElementById('status');

let selectedFile = null;

// Show preview
imageInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        compressAndPreview(selectedFile);
    }
});

// Compress + preview
function compressAndPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Max dimensions (e.g., 800x800)
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Quality: 0.7 = 70% (good balance)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            preview.src = compressedBase64;
            preview.style.display = 'block';

            // Store compressed version for upload
            selectedFile.compressedBase64 = compressedBase64;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Upload compressed image
uploadBtn.addEventListener('click', async () => {
    if (!selectedFile || !selectedFile.compressedBase64) {
        status.textContent = "Please select and process an image!";
        status.style.color = "red";
        return;
    }

    status.textContent = "Uploading...";
    status.style.color = "blue";

    try {
        const user = getUserFromToken(); // Optional: get from login
        const payload = {
            imageData: selectedFile.compressedBase64,
            filename: selectedFile.name.replace(/\.[^/.]+$/, "") + ".jpg", // Force .jpg
            contentType: "image/jpeg",
            userId: user?.userId || "675f2a1b9d8e3c2a1f5b9e2d",
            nickname: user?.nickname || "testuser"
        };

        const response = await fetch('http://localhost:3000/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            status.textContent = "Image uploaded (compressed)!";
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

// Optional: Extract user from JWT
function getUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { userId: payload.userId, nickname: payload.nickname };
    } catch {
        return null;
    }
}