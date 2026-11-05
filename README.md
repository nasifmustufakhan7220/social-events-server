# Social Events API

A REST API built with **Express.js** and **MongoDB** for creating, managing, and joining social events. Protected routes are secured with JWT verification (via a remote JWKS endpoint), and the app is designed to run both locally and on serverless platforms like **Vercel**.

## Features

- Create, update, and delete events
- View all events or a single upcoming event
- Join an event and track which users joined
- View events created by a specific user
- View events joined by a specific user
- JWT authentication using `jose` and a remote JWKS
- Serverless-safe MongoDB connection (cached across invocations)
- Cascade delete: deleting an event also removes all its joined-user records

## Tech Stack

- [Node.js](https://nodejs.org/) (ES Modules)
- [Express](https://expressjs.com/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [jose](https://github.com/panva/jose) for JWT verification
- [cors](https://github.com/expressjs/cors) and [dotenv](https://github.com/motdotla/dotenv)

## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB database (e.g. MongoDB Atlas)
- An auth server that exposes a JWKS endpoint at `<CLIENT_URL>api/auth/jwks`

### Installation

```bash
git clone <https://github.com/nasifmustufakhan7220/social-events-server.gitl>
cd <social-events-serverr>
npm install
```

Make sure your `package.json` contains:

```json
{
  "type": "module"
}
```

### Environment Variables

Create a `.env` file in the project root:

```env
MONGO_CLIENT_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
CLIENT_URL=http://localhost:3000/
NODE_ENV=development
```

### Run the Server

```bash
node index.js
```

The server starts at `http://localhost:8000`.

## Authentication

Routes marked with 🔒 require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

The token is verified against the remote JWKS at `${CLIENT_URL}api/auth/jwks`. Missing or invalid tokens return `401`.

## API Endpoints

| Method | Endpoint               | Auth | Description                                     |
| ------ | ---------------------- | ---- | ----------------------------------------------- |
| GET    | `/`                    |      | Health check                                    |
| GET    | `/all`                 |      | Get all events                                  |
| GET    | `/up-comming/:id`      |      | Get a single event by its ID                    |
| POST   | `/create-event`        | 🔒   | Create a new event                              |
| GET    | `/manage-event/:email` | 🔒   | Get all events created by a user (by email)     |
| PATCH  | `/manage-event/:id`    | 🔒   | Update an event by ID                           |
| DELETE | `/manage-delete/:id`   | 🔒   | Delete an event and all its joined-user records |
| POST   | `/joined-users`        | 🔒   | Join an event                                   |
| GET    | `/joined-events/:id`   | 🔒   | Get all users who joined a specific event       |
| GET    | `/joined-users/:email` | 🔒   | Get all events a user has joined                |
| DELETE | `/joined-users/:id`    | 🔒   | Remove a join record (leave an event)           |

### Example Requests

**Create an event**

```bash
curl -X POST http://localhost:8000/create-event \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Community Clean-up",
    "date": "2026-12-01",
    "location": "Dhaka",
    "userEmail": "user@example.com"
  }'
```

**Join an event**

```bash
curl -X POST http://localhost:8000/joined-users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventID": "<event-id>",
    "userEmail": "user@example.com"
  }'
```

## Database Structure

Database: `socialEvenets`

| Collection    | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `events`      | Stores event documents (must include `userEmail` of the creator) |
| `joinedUsers` | Stores join records (must include `eventID` and `userEmail`)     |

## Error Responses

| Status | Meaning                         |
| ------ | ------------------------------- |
| `401`  | Missing or invalid token        |
| `500`  | Internal server error           |
| `503`  | Database connection unavailable |

## Deployment (Vercel)

The app exports the Express instance (`export default app`) and only calls `app.listen()` when `NODE_ENV` is not `production`, so it works on Vercel out of the box.

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add `MONGO_CLIENT_URI`, `CLIENT_URL`, and `NODE_ENV=production` in the project's Environment Variables.
4. Make sure a `vercel.json` routes all requests to your entry file.
5. Deploy.

## License

This project is licensed under the MIT License.
