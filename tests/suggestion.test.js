require("dotenv").config({ path: ".env" });

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const authRouter = require("../routes/auth");
const cardRouter = require("../routes/cards");
const suggestionRouter = require("../routes/suggestions");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();
app.use(express.json());
app.use("/auth", authRouter);
app.use("/cards", cardRouter);
app.use("/suggestions", suggestionRouter);

let mongoServer;
let cardId;
let suggestionId;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Register and login a test user
  const res = await request(app)
    .post("/auth/register")
    .send({ username: "testUser", password: "testPass123" });

  const loginResponse = await request(app)
    .post("/auth/login")
    .send({ username: "testUser", password: "testPass123" });

  token = loginResponse.body.token;

  const cardResponse = await request(app)
    .post("/cards")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Test Card",
      description: "Test card for suggestions",
      status: "To Do",
    });

  cardId = cardResponse.body._id;
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  console.log("Disconnected from in-memory MongoDB");
});

describe("Suggestion Operations", () => {
  // Add Suggestion
  describe("POST /suggestions/:cardId", () => {
    it("should add a new suggestion to a card", async () => {
      const response = await request(app)
        .post(`/suggestions/${cardId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          text: "This is a new suggestion",
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Suggestion added");
      expect(response.body.suggestion.text).toBe("This is a new suggestion");

      const cardDetailsResponse = await request(app)
        .get(`/cards/details/${cardId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(cardDetailsResponse.status).toBe(200);
      const suggestions = cardDetailsResponse.body.suggestions;

      const newSuggestion = suggestions[suggestions.length - 1];

      suggestionId = newSuggestion._id;

      expect(suggestionId).toBeDefined();
    });

    it("should return 400 if suggestion text is missing", async () => {
      const response = await request(app)
        .post(`/suggestions/${cardId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Suggestion text is required");
    });

    it("should update an existing suggestion", async () => {
      const response = await request(app)
        .put(`/suggestions/${cardId}/${suggestionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          text: "Updated suggestion text",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Suggestion updated");
      expect(response.body.suggestion.text).toBe("Updated suggestion text");
    });
  });

  // Update Suggestion
  describe("PUT /suggestions/:cardId/:suggestionId", () => {
    it("should return 403 if the user is not the creator of the suggestion", async () => {
      // Create another user and attempt to update the suggestion
      const newUser = await request(app)
        .post("/auth/register")
        .send({ username: "anotherUser", password: "anotherPass123" });

      const newLoginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "anotherUser", password: "anotherPass123" });

      const newToken = newLoginResponse.body.token;

      const response = await request(app)
        .put(`/suggestions/${cardId}/${suggestionId}`)
        .set("Authorization", `Bearer ${newToken}`)
        .send({
          text: "Unauthorized update attempt",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You are not authorized to update this suggestion"
      );
    });

    it("should return 404 if suggestion is not found", async () => {
      const response = await request(app)
        .put(`/suggestions/${cardId}/invalidSuggestionId`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          text: "Trying to update a non-existent suggestion",
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Suggestion not found");
    });
  });

  // Delete Suggestion
  describe("DELETE /suggestions/:cardId/:suggestionId", () => {
    it("should return 403 if the user is not the creator of the suggestion", async () => {
      // Create another user and attempt to delete the suggestion
      const newUser = await request(app)
        .post("/auth/register")
        .send({ username: "anotherUser", password: "anotherPass123" });

      const newLoginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "anotherUser", password: "anotherPass123" });

      const newToken = newLoginResponse.body.token;

      const response = await request(app)
        .delete(`/suggestions/${cardId}/${suggestionId}`)
        .set("Authorization", `Bearer ${newToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You are not authorized to delete this suggestion"
      );
    });

    it("should delete a suggestion", async () => {
      const response = await request(app)
        .delete(`/suggestions/${cardId}/${suggestionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Suggestion deleted successfully");
    });

    it("should return 404 if suggestion is not found", async () => {
      const response = await request(app)
        .delete(`/suggestions/${cardId}/invalidSuggestionId`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Suggestion not found");
    });
  });
});
