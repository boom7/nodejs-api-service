require("dotenv").config({ path: ".env" });

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const authRouter = require("../routes/auth");
const cardRouter = require("../routes/cards");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();
app.use(express.json());
app.use("/auth", authRouter);  
app.use("/cards", cardRouter); 

let mongoServer;
let cardId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to in-memory MongoDB");
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  console.log("Disconnected from in-memory MongoDB");
});

describe("Card Operations", () => {
  let token;

  // Register and Login User before creating cards
  beforeAll(async () => {
    // Register a test user
    const res = await request(app)
      .post("/auth/register")
      .send({
        username: "testUser",
        password: "testPass123",
      });

    // Login 
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        username: "testUser",
        password: "testPass123",
      });

    token = loginResponse.body.token; 
  });

    it("should create a new card", async () => {
      const response = await request(app)
        .post("/cards/")
        .set("Authorization", `Bearer ${token}`)  // Use the JWT token for authentication
        .send({
          title: "Test Card",
          description: "This is a test card description",
          status: "To Do", // Valid status
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Test Card");
      expect(response.body.description).toBe("This is a test card description");
      expect(response.body.status).toBe("To Do");
      expect(response.body.createdBy).toBeDefined();
      
      cardId = response.body._id;
    });

    it("should not be able to create a card with invalid status", async () => {
      const response = await request(app)
        .post("/cards/")
        .set("Authorization", `Bearer ${token}`) 
        .send({
          title: "Test Card",
          description: "This is a test card description",
          status: "Open", // Invalid status
        });

      expect(response.status).toBe(500); 
    });

    it("should update an existing card", async () => {
        const response = await request(app)
          .put(`/cards/${cardId}`)
          .set("Authorization", `Bearer ${token}`) 
          .send({
            title: "New Card",
            status: "Done",
          });
  
        expect(response.status).toBe(200); 
        expect(response.body.title).toBe("New Card"); 
        expect(response.body.status).toBe("Done"); 
      });
  });
