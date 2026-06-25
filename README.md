# GitHub Profile Analyzer API

A production-ready REST API built with **Node.js**, **Express.js**, and **MySQL** that analyzes GitHub user profiles via the GitHub public API and stores enriched insights in a MySQL database.

---

## Features

- **Analyze any GitHub user** — fetches complete profile data + all public repositories
- **Computed Insights** stored per user:
  - Public repository & gist counts
  - Follower / following counts
  - **Total stars** received across all repos
  - **Total forks** received across all repos
  - **Most used programming language** (by repo count)
  - **Top 5 repositories** by star count (name, description, stars, forks, language, topics)
  - Account creation date
- **Upsert logic** — re-analyzing a user refreshes their data automatically
- Paginated & sortable list endpoint
- Rate limiting & security headers (Helmet, CORS)
- Centralized error handling with meaningful messages

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL (via `mysql2`) |
| External API | GitHub REST API v3 |
| Security | Helmet, express-rate-limit, CORS |
| HTTP Client | Axios |

---

## Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+ running locally or remotely
- (Optional) **GitHub Personal Access Token** — increases API rate limit from 60 to 5000 req/hour

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd github-profile-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional but recommended — get one at https://github.com/settings/tokens
GITHUB_TOKEN=your_github_personal_access_token
```

### 4. Set Up the Database

**Option A: Auto-initialize (recommended)**
The server automatically creates the `github_profiles` table on startup. Just make sure the `github_analyzer` database exists:

```sql
CREATE DATABASE IF NOT EXISTS github_analyzer;
```

**Option B: Manual schema import**

```bash
mysql -u root -p github_analyzer < database/schema.sql
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start at `http://localhost:3000`.

---

## API Endpoints

### Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/analyze/:username` | Analyze & store a GitHub profile |
| `GET` | `/api/profiles` | List all stored profiles (paginated) |
| `GET` | `/api/profiles/:username` | Get a single profile's full insights |
| `DELETE` | `/api/profiles/:username` | Delete a stored profile |

---

### `POST /api/analyze/:username`

Fetches the GitHub profile + all public repositories, computes insights, and upserts the result into MySQL.

**Example:**
```bash
curl -X POST http://localhost:3000/api/analyze/torvalds
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile for 'torvalds' analyzed and stored successfully",
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "location": "Portland, OR",
    "public_repos": 7,
    "followers": 230000,
    "total_stars": 190000,
    "total_forks": 55000,
    "most_used_language": "C",
    "top_repos": [
      {
        "name": "linux",
        "stars": 185000,
        "forks": 52000,
        "language": "C"
      }
    ]
  }
}
```

---

### `GET /api/profiles`

Returns all analyzed profiles with pagination and sorting.

**Query Parameters:**

| Parameter | Default | Options |
|-----------|---------|---------|
| `page` | `1` | Any positive integer |
| `limit` | `10` | 1–100 |
| `sort_by` | `last_analyzed_at` | `followers`, `total_stars`, `public_repos`, `last_analyzed_at`, `created_at` |
| `order` | `desc` | `asc`, `desc` |

**Example:**
```bash
curl "http://localhost:3000/api/profiles?page=1&limit=5&sort_by=total_stars&order=desc"
```

---

### `GET /api/profiles/:username`

Retrieves the full stored record for a username.

```bash
curl http://localhost:3000/api/profiles/torvalds
```

---

### `DELETE /api/profiles/:username`

Removes a profile record from the database.

```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

## Database Schema

See [`database/schema.sql`](database/schema.sql) for the full schema export.

### Table: `github_profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment primary key |
| `username` | VARCHAR(255) UNIQUE | GitHub login |
| `name` | VARCHAR(255) | Display name |
| `bio` | TEXT | Profile bio |
| `location` | VARCHAR(255) | User location |
| `email` | VARCHAR(255) | Public email |
| `blog` | VARCHAR(500) | Website URL |
| `company` | VARCHAR(255) | Company |
| `avatar_url` | VARCHAR(500) | Avatar image URL |
| `github_url` | VARCHAR(500) | GitHub profile URL |
| `public_repos` | INT | Public repository count |
| `public_gists` | INT | Public gist count |
| `followers` | INT | Follower count |
| `following` | INT | Following count |
| `total_stars` | INT | **Computed**: sum of stars across all repos |
| `total_forks` | INT | **Computed**: sum of forks across all repos |
| `most_used_language` | VARCHAR(100) | **Computed**: most frequent language |
| `top_repos` | JSON | **Computed**: top 5 repos by stars |
| `account_created_at` | DATETIME | GitHub account creation date |
| `last_analyzed_at` | DATETIME | When data was last refreshed |
| `created_at` | DATETIME | When record was first inserted |

---

## Postman Collection

Import [`postman/GitHub_Analyzer.postman_collection.json`](postman/GitHub_Analyzer.postman_collection.json) into Postman.

Set the `base_url` variable to `http://localhost:3000` (or your deployed URL).

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

| Status | Scenario |
|--------|----------|
| 400 | Invalid username format |
| 404 | GitHub user not found / Profile not in DB |
| 429 | GitHub API rate limit exceeded |
| 503 | Database connection failure |
| 500 | Unexpected server error |

---

## GitHub API Rate Limits

- **Without token**: 60 requests/hour per IP
- **With token**: 5,000 requests/hour

Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens) (no scopes needed for public data) and add it to your `.env` file.

---

## Project Structure

```
├── src/
│   ├── app.js                    # Express app entry point
│   ├── config/
│   │   └── db.js                 # MySQL connection pool + table init
│   ├── controllers/
│   │   └── profileController.js  # Request handlers
│   ├── routes/
│   │   └── profileRoutes.js      # Route definitions
│   ├── services/
│   │   └── githubService.js      # GitHub API client + insight computation
│   └── middleware/
│       └── errorHandler.js       # Centralized error handling
├── database/
│   └── schema.sql                # MySQL schema export
├── postman/
│   └── GitHub_Analyzer.postman_collection.json
├── .env.example
├── .gitignore
└── package.json
```
