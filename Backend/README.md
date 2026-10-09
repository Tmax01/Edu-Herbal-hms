# edu-herbal-hms-backend

Enterprise Herbal Hospital Management System (HMS) Backend built with NestJS, Prisma ORM, PostgreSQL, Redis, MinIO, and Docker.

## Tech Stack
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache & Queue**: Redis
- **Storage**: MinIO / S3
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL & Redis

### Installation
```bash
npm install
```

### Environment Setup
Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

### Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev
```

### Running the Application
```bash
# Development mode
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```
