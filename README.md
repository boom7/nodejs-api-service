API Endpoints

Authentication

POST /auth/register
- Description: Registers a new user.
- Body: { "username": "string", "password": "string" }
- Response: { "message": "User created successfully!" }

POST /auth/login
- Description: Logs in a user and returns a JWT token.
- Body: { "username": "string", "password": "string" }
- Response: { "token": "JWT_Token" }

Card Operations

POST /cards
- Description: Creates a new card.
- Body: { "title": "string", "description": "string", "status": "string" }
- Response: { "_id": "string", "title": "string", "description": "string", "status": "string", "createdBy": "string" }

PUT /cards/:cardId
- Description: Updates an existing card.
- Body: { "title": "string", "status": "string" }
- Response: { "_id": "string", "title": "string", "description": "string", "status": "string" }

GET /cards/details/:cardId
- Description: Retrieves card details with suggestions.
- Response: { "_id": "string", "title": "string", "description": "string", "status": "string", "suggestions": [{ "_id": "string", "text": "string" }] }

DELETE /cards/:cardId
- Description: Deletes a card.
- Response: { "message": "Card deleted successfully" }

Suggestion Operations

POST /suggestions/:cardId
- Description: Adds a suggestion to a card.
- Body: { "text": "string" }
- Response: { "message": "Suggestion added", "suggestion": { "_id": "string", "text": "string" } }

PUT /suggestions/:cardId/:suggestionId
- Description: Updates an existing suggestion.
- Body: { "text": "string" }
- Response: { "message": "Suggestion updated", "suggestion": { "_id": "string", "text": "string" } }

DELETE /suggestions/:cardId/:suggestionId
- Description: Deletes a suggestion.
- Response: { "message": "Suggestion deleted successfully" }

Authentication Header

All authenticated routes require the `Authorization` header:

Authorization: Bearer <JWT_Token>