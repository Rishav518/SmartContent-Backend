# AI Blog Automation Microservice

A Node.js microservice that automatically generates unique blog content using DEEPSEEK AI, checks for duplicates in MongoDB, and publishes new posts.

## Features

- Automated blog topic generation with category/subcategory classification
- Duplicate detection system to prevent content overlap
- Complete post generation with title and formatted content
- WebSocket integration with DEEPSEEK AI
- MongoDB storage with efficient querying and indexing
- Scheduled content generation via cron jobs
- RESTful API endpoints for manual content generation
- Modular architecture with separation of concerns

## System Architecture

```
/ai-blog-automation/
├── src/
│   ├── routes/            # API route definitions
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── prompts/           # AI prompts templates
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration
│   ├── jobs/              # Scheduled jobs
│   └── app.js             # Application entry point
├── .env                   # Environment variables
├── package.json           # Dependencies
└── README.md              # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- DEEPSEEK AI service running on port 8000

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables by creating a `.env` file based on the provided example.

4. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Generate a New Blog Post

```
POST /api/blog/generate
```

Request body:
```json
{
  "category": "Technology",
  "subcategory": "AI",
  "keywords": ["machine learning", "neural networks"],
  "minWords": 600,
  "maxWords": 1200,
  "autoPublish": false
}
```

### Generate Multiple Posts (Batch)

```
POST /api/blog/generate-batch
```

Request body:
```json
{
  "count": 3,
  "category": "Technology",
  "autoPublish": false
}
```

### Get All Posts

```
GET /api/blog/posts?page=1&limit=10&status=published
```

### Get Post by ID

```
GET /api/blog/posts/:id
```

### Update Post Status

```
PATCH /api/blog/posts/:id/status
```

Request body:
```json
{
  "status": "published"
}
```

### Run Scheduler Now

```
POST /api/blog/run-scheduler
```

## Scheduling

The system runs an automated blog generation job based on the schedule defined in the `.env` file. By default, it runs every hour.

## Configuration

All configuration is managed through environment variables:

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `DEEPSEEK_WS_URL`: WebSocket URL for the DEEPSEEK AI service
- `SCHEDULE_ENABLED`: Enable/disable the scheduler
- `SCHEDULE_INTERVAL`: Cron expression for scheduling (default: "0 */1 * * *")
- `DEFAULT_CATEGORIES`: Array of default categories
- `DEFAULT_SUBCATEGORIES`: Object mapping categories to subcategories

## License

This project is licensed under the MIT License - see the LICENSE file for details.