const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// Register a new user
router.post(
  "/register",
  [
    // Input validation
    body("username")
      .isLength({ min: 6 })
      .withMessage("Username must be at least 6 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: errors.array()[0].msg });
    }
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: "Username already taken" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 8);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.status(201).send({ message: "User created successfully!" });
    } catch (error) {
      res.status(400).send({ message: "Registration failed" });
    }
  }
);

// User login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.send({ token });
  } catch (error) {
    console.error("Error during login:", error);

    // Return a server error if anything goes wrong
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
