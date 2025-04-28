const express = require('express');
const Card = require('../models/Card');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

// Add suggestion
router.post('/:cardId', authenticate, async (req, res) => {
  const { cardId } = req.params;
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).send({ message: 'Suggestion text is required' });
  }
  try {
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).send({ message: 'Card not found' });

    const newSuggestion = { text, createdBy: req.user._id };
    card.suggestions.push(newSuggestion);
    await card.save();

    res.status(201).send({ message: 'Suggestion added', suggestion: newSuggestion });
  } catch (err) {
    res.status(500).send({ message: 'Unable to add suggestion' });
  }
});

// Update suggestion
router.put('/:cardId/:suggestionId', authenticate, async (req, res) => {
  const { cardId, suggestionId } = req.params;
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).send({ message: 'Suggestion text is required' });
  }
  try {
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).send({ message: 'Card not found' });

    const suggestion = card.suggestions.id(suggestionId);
    if (!suggestion) return res.status(404).send({ message: 'Suggestion not found' });

    if (suggestion.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'You are not authorized to update this suggestion' });
    }

    suggestion.text = text;
    await card.save();

    res.status(200).send({ message: 'Suggestion updated', suggestion });
  } catch (err) {
    res.status(500).send({ message: 'Unable to update suggestion' });
  }
});

// Delete suggestion
router.delete('/:cardId/:suggestionId', authenticate, async (req, res) => {
  const { cardId, suggestionId } = req.params;
  try {
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).send({ message: 'Card not found' });

    const suggestion = card.suggestions.id(suggestionId);
    if (!suggestion) return res.status(404).send({ message: 'Suggestion not found' });

    if (suggestion.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'You are not authorized to delete this suggestion' });
    }

    card.suggestions.pull(suggestionId);
    await card.save();

    res.status(200).send({ message: 'Suggestion deleted successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Unable to delete suggestion' });
  }
});

module.exports = router;
