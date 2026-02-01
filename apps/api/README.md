# KU AI Control Backend API

NestJS 10+ backend API for KU AI Control Platform.

## Project Structure

```
src/
├── modules/              # Domain modules
│   ├── auth/            # Authentication & authorization
│   ├── users/           # User management
│   ├── dashboard/       # Dashboard data
│   ├── products/        # Product management
│   ├── orders/          # Order management
│   ├── customers/       # Customer management
│   ├── analytics/       # Analytics data
│   └── settings/        # Application settings
├── common/              # Shared modules
│   ├── decorators/      # Custom decorators (@Public, @Roles)
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards (JWT, Roles)
│   ├── pipes/           # Validation pipes
│   └── interceptors/    # Request/response interceptors
├── config/              # Configuration
├── database/            # Database management
│   ├── migrations/      # TypeORM migrations
│   └── seeds/           # Database seeds
├── app.module.ts        # Root module
└── main.ts             # Application entry point
```

## Technology Stack

- **Framework**: NestJS 10.3+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger (OpenAPI 3.0)
- **Testing**: Jest, Supertest
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (workspace manager)

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRATION`, `JWT_REFRESH_TOKEN_EXPIRATION`
- `ALLOWED_ORIGINS` (comma-separated list)

## Database Setup

```bash
# Run migrations
pnpm migration:run

# Run seeds (optional)
pnpm seed:run

# Create new migration
pnpm migration:create src/database/migrations/MigrationName

# Generate migration from entity changes
pnpm migration:generate src/database/migrations/MigrationName

# Revert last migration
pnpm migration:revert
```

## Running the Application

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod

# Debug mode
pnpm start:debug
```

## API Documentation

Once the application is running, access Swagger documentation at:
- http://localhost:3001/api/v1/docs

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

## Code Quality

```bash
# Lint
pnpm lint

# Format
pnpm format
```

## API Structure

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { /* resource data */ },
  "meta": { // Optional, for paginated responses
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User-friendly error message",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/users/123"
  }
}
```

### Status Codes

- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Helmet**: Security headers
- **CORS**: Whitelist-based origin control
- **Rate Limiting**: Throttler guards
- **Input Validation**: DTO validation with class-validator
- **JWT Authentication**: Access token (15min) + Refresh token (7 days)
- **RBAC**: Role-based access control

## Next Steps

1. Implement database entities for each module
2. Add business logic to service classes
3. Configure TypeORM migrations
4. Add comprehensive test coverage
5. Implement proper error handling
6. Add logging with Winston/Pino
7. Configure Redis for caching
8. Set up CI/CD pipelines

## License

UNLICENSED
