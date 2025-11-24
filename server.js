import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
// CORS + LARGE PAYLOAD FIX (replace the 4 lines above with these 3)
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true
}));

app.use(express.json({ limit: "15mb" }));                    // Allow big base64 images
app.use(express.urlencoded({ limit: "15mb", extended: true }));


// connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ Connection error:", err));

// Basic db webpage
app.get("/", (req, res) => {
    res.send("Welcome to Vote.me mongodb manager 🚀");
});


// MANAGING USERS
// ✅ User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    nickname: String,
    email: { type: String, unique: true, required: true },
    password: String,
});
const User = mongoose.model("User", userSchema, "users");
// Route: Add new user
app.post("/api/users", async (req, res) => {
    try {
        const { name, nickname, email, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { nickname }] });
        if (existingUser) {
            return res.status(400).json({ error: "Email or nickname already exists" });
        }

        const newUser = new User({ name, nickname, email, password });
        await newUser.save();

        const token = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email,
                name: newUser.name,
                nickname: newUser.nickname
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: { email: newUser.email, name: newUser.name, nickname: newUser.nickname }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Route: Get all users
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Route: Check if email or nickname are available
app.post("/api/users/checkuser", async (req, res) => {
    try {
        const { nickname, email } = req.body;

        // console.log("User data: ", nickname, email)

        const users = await User.find();


        let foundEmail = false;
        let foundNickname = false

        for (let i = 0; i < users.length; i++) {
            if (users[i].email === email)
                foundEmail = true;
            if (users[i].nickname === nickname)
                foundNickname = true;
            if (foundEmail && foundNickname)
                break;
        }

        // console.log(foundEmail, foundNickname)
        res.json({
            emailFound: foundEmail,
            nicknameFound: foundNickname
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Route: Check the user that's trying to log in
app.post("/api/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        const userFound = !!user;
        let passwordMatched = false;

        if (userFound && user.password === password) {
            passwordMatched = true;
        }

        // Generate JWT secret
        if (userFound && passwordMatched) {
            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    name: user.name,
                    nickname: user.nickname
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({
                success: true,
                token,
                user: { email: user.email, name: user.name, nickname: user.nickname }
            });
        }

        // Send clean response
        res.json({
            userFound,
            passwordMatched
        });

    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});
// Route: Check user auth token
app.get("/api/auth/check", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ loggedIn: false });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ loggedIn: false });
        }
        res.json({
            loggedIn: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name,
                nickname: decoded.nickname
            }
        });
    });
});


// ✅ Poll schema and model
// UPLOADING POLLS (2 images + texts + user)
const pollSchema = new mongoose.Schema({
    option1: {
        imageData: String,    // full size
        thumbData: String,    // thumbnail size
        filename: String,
        contentType: String,
        text: String
    },
    option2: {
        imageData: String,   // full size
        thumbData: String,   // thumbnail size
        filename: String,
        contentType: String,
        text: String
    },
    nickname: String,
    uploadDate: { type: Date, default: Date.now }
});
const Poll = mongoose.model("Poll", pollSchema, "polls");

// Route: Upload poll (two images + texts)
app.post("/api/polls", async (req, res) =>  {
    try {
        const { option1, option2, nickname } = req.body;

        const newPoll = new Poll({
            option1,
            option2,
            nickname
        });

        await newPoll.save();
        res.json({ success: true, message: "Poll saved!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// Route: Get all polls
app.get("/api/polls", async (req, res) => {
    try {
        const polls = await Poll.find().sort({ uploadDate: -1 });
        res.json(polls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ULTRA-FAST endpoint for main page – only thumbnails + text (5–15 KB per poll)
app.get("/api/polls/thumbs", async (req, res) => {
    try {
        const polls = await Poll.find()
            .select("option1.thumbData option1.text option2.thumbData option2.text nickname uploadDate _id")
            .sort({ uploadDate: -1 })
            .lean(); // removes MongoDB bloat

        res.json(polls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Listen on that port
app.listen(process.env.PORT, () =>
    console.log("🚀 Server running on port 3000")
);