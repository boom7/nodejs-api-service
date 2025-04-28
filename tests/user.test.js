require("dotenv").config({ path: ".env" });

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const authRouter = require("../routes/auth");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

let mongoServer;

// Setup MongoDB in-memory server
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log("Connected to in-memory MongoDB");
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  console.log("Disconnected from in-memory MongoDB");
});

describe("User Operations", () => {
  // Register User
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ username: "testUser", password: "testPass123" });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User created successfully!");

      // Verify user was saved to the database
      const user = await User.findOne({ username: "testUser" });
      expect(user).toBeTruthy();
      expect(user.username).toBe("testUser");
    });

    it("should return 400 if username already exists", async () => {
      // First create the user
      await request(app)
        .post("/auth/register")
        .send({ username: "testUser", password: "testPass123" });

      const response = await request(app)
        .post("/auth/register")
        .send({ username: "testUser", password: "testPass123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username already taken");
    });

    it("should return 400 if password or username is too short", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ username: "test", password: "123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Username must be at least 6 characters"
      );
    });
  });

  // Login User
  describe("POST /auth/login", () => {
    it("should log in the user and return a token", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ username: "testUser", password: "testPass123" });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined(); // JWT token should be returned
    });

    it("should return 400 for invalid credentials", async () => {
      // Attempt to log in with non-existent user
      const response = await request(app)
        .post("/auth/login")
        .send({ username: "nonExistentUser", password: "wrongPass123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });
});
