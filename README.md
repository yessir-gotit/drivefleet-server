# DriveFleet — Server API

**Backend API for the DriveFleet premium car rental platform.** Handles authentication, vehicle inventory management, and booking operations.

🌐 **Live API URL:** [https://drivefleet-server-jade.vercel.app/](https://drivefleet-server-jade.vercel.app/)

🔗 **Client Live Site:** [https://drivefleet-rho.vercel.app/](https://drivefleet-rho.vercel.app/)

---

## Features

- **Secure Authentication with Better Auth** — Full email/password and Google OAuth integration with secure cookie-based sessions, protecting all user-specific endpoints.
- **Full Car Inventory CRUD** — RESTful endpoints to create, read, update, and delete vehicle listings with filtering by car type, search keyword, and availability status.
- **Instant Booking System** — Authenticated users can book vehicles in real-time; the API validates availability, increments a booking counter, and stores driver preference and special notes.
- **User-Scoped Data Access** — Bookings and car listings are scoped to the authenticated user, ensuring that users can only view, edit, or delete their own resources.
- **Vercel-Optimized Serverless Deployment** — Built with Express.js and deployed via Vercel serverless functions, using `@vercel/functions` for background task handling and `cookie-parser` for cross-origin credential management.

## Tech Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| **Runtime**   | [Node.js](https://nodejs.org/)            |
| **Framework** | [Express.js](https://expressjs.com/)      |
| **Auth**      | [Better Auth](https://www.better-auth.com/) |
| **Database**  | [MongoDB](https://www.mongodb.com/)       |
| **Deployment**| [Vercel](https://vercel.com/)             |

## API Endpoints

### Authentication (`/api/auth/*`)

Handled by Better Auth — includes sign-up, sign-in, sign-out, and session management.

### Cars (`/api/cars`)

| Method   | Endpoint            | Auth Required | Description                          |
| -------- | ------------------- | :-----------: | ------------------------------------ |
| `GET`    | `/api/cars`         | ❌            | List all cars (supports `?carType=`, `?search=`, `?isAvailable=` filters) |
| `GET`    | `/api/cars/:id`     | ❌            | Get a single car by ID               |
| `GET`    | `/api/cars/user/:uid` | ❌          | Get all cars added by a specific user |
| `POST`   | `/api/cars`         | ✅            | Add a new car to the fleet           |
| `PUT`    | `/api/cars/:id`     | ✅            | Update a car (owner only)            |
| `DELETE` | `/api/cars/:id`     | ✅            | Delete a car (owner only)            |

### Bookings (`/api/bookings`)

| Method   | Endpoint                 | Auth Required | Description                          |
| -------- | ------------------------ | :-----------: | ------------------------------------ |
| `POST`   | `/api/bookings`          | ✅            | Create a new booking                 |
| `GET`    | `/api/bookings/user/me`  | ✅            | Get current user's bookings          |
| `GET`    | `/api/bookings/user/:uid`| ✅            | Get bookings for a specific user     |
| `GET`    | `/api/bookings/:id`      | ✅            | Get a single booking by ID           |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Start the development server
npm run dev
```

The server will start at [http://localhost:5000](http://localhost:5000).

## Environment Variables

| Variable                    | Description                                |
| --------------------------- | ------------------------------------------ |
| `DATABASE_URL`              | MongoDB connection string                  |
| `BETTER_AUTH_URL`           | Base URL for Better Auth (e.g., `https://drivefleet-server-jade.vercel.app`) |
| `BETTER_AUTH_SECRET`        | Better Auth secret key                     |
| `GOOGLE_CLIENT_ID`          | Google OAuth client ID                     |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth client secret                 |
| `FRONTEND_PRODUCTION_URL`   | Client-side production URL for CORS        |

---

*Built with Express.js, Better Auth, and MongoDB.*
