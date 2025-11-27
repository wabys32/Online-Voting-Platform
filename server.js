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
    option1Votes: { type: Number, default: 0 },
    option2Votes: { type: Number, default: 0 },
    votedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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

// SUPER LIGHT list – no images at all (just texts + IDs for main page)
app.get("/api/polls/light", async (req, res) => {
    try {
        const polls = await Poll.find()
            .select("option1.text option2.text nickname uploadDate _id")
            .sort({ uploadDate: -1 })
            .lean();

        res.json(polls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get thumbnails for a single poll (lazy load)
app.get("/api/polls/:id/thumbs", async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id)
            .select("option1.thumbData option2.thumbData")
            .lean();

        if (!poll) return res.status(404).json({ error: "Poll not found" });
        res.json(poll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get one full poll (used when clicking on polls)
app.get("/api/polls/:id", async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id).lean();
        if (!poll) return res.status(404).json({ error: "Poll not found" });
        res.json(poll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Vote for an option of a poll
app.post("/api/polls/:id/vote", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Login required to vote" });

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { option } = req.body; // 1 or 2
        if (option !== 1 && option !== 2) return res.status(400).json({ error: "Invalid option" });

        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: "Poll not found" });

        if (poll.votedUsers.some(id => id.equals(userId))) {
            return res.status(403).json({ error: "You already voted" });
        }

        if (option === 1) poll.option1Votes += 1;
        else poll.option2Votes += 1;

        poll.votedUsers.push(userId);
        await poll.save();

        res.json({ success: true, option1Votes: poll.option1Votes, option2Votes: poll.option2Votes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Check if user has already voted
app.get("/api/polls/:id/checkvote", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Login required to check vote" });

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: "Poll not found" });

        if (poll.votedUsers.some(id => id.equals(userId))) {
            return res.status(403).json({ error: "You already voted" });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Listen on that port
app.listen(process.env.PORT, () =>
    console.log("🚀 Server running on port 3000")
);