const express = require("express");
const Card = require("../models/Card");
const { authenticate, authorizeRoles } = require("../middlewares/auth");
const router = express.Router();

// Get all cards
router.get(
  "/",
  authenticate,
  authorizeRoles(["admin", "user"]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || parseInt(process.env.DEFAULT_PAGE);
      const limit = parseInt(req.query.limit) || parseInt(process.env.DEFAULT_LIMIT);
      const skip = (page - 1) * limit;
      const totalCards = await Card.countDocuments();
      const cards = await Card.find().skip(skip).limit(limit);
      res.status(200).send({
        totalCards,
        totalPages: Math.ceil(totalCards / limit),
        currentPage: page,
        cards,
      });
    } catch (error) {
      res.status(500).send({ message: "Unable to retrieve cards" });
    }
  }
);

// Create a new card
router.post("/", authenticate, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const newCard = new Card({
      title,
      description,
      status,
      createdBy: req.user._id,
    });
    await newCard.save();
    res.status(201).send(newCard);
  } catch (error) {
    res.status(500).send({ message: "Unable to create card" });
  }
});

// Get card details
router.get("/details/:cardId", authenticate, async (req, res) => {
  const { cardId } = req.params;
  try {
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).send({ message: "Card not found" });
    }
    res.status(200).send(card);
  } catch (error) {
    res.status(500).send({ message: "Unable to retrieve card details" });
  }
});

// Update card
router.put("/:cardId", authenticate, async (req, res) => {
  const { cardId } = req.params;
  const { title, description, status } = req.body;
  try {
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).send({ message: "Card not found" });

    const changes = [];
    if (title && title !== card.title) {
      changes.push(`Title changed from "${card.title}" to "${title}"`);
      card.title = title;
    }
    if (description && description !== card.description) {
      changes.push(
        `Description changed from "${card.description}" to "${description}"`
      );
      card.description = description;
    }
    if (status && status !== card.status) {
      changes.push(`Status changed from "${card.status}" to "${status}"`);
      card.status = status;
    }
    if (changes.length > 0) {
      card.histories.push({
        updatedBy: req.user._id,
        changeDescription: `Card updated: ${changes.join(", ")}`,
      });
    }
    await card.save();
    res.status(200).send(card);
  } catch (err) {
    res.status(500).send({ message: "Unable to update card details" });
  }
});

// Delete card
router.delete("/:cardId", authenticate, async (req, res) => {
  const { cardId } = req.params;
  try {
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).send({ message: "Card not found" });
    }
    await card.remove();
    res.status(200).send({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Unable to delete card" });
  }
});

module.exports = router;
