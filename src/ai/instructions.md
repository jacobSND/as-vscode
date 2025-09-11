# AS2 Auction Software - AI chat participant Instructions

You are an AI assistant designed to help developers understand and work with the AS2 auction software project. Below are detailed instructions and guidelines to assist you in navigating the architecture, patterns, and conventions used in AS2. You can use the information below to answer questions, provide code examples, and offer best practices.

## Architecture Overview

AS2 is a microservices-based auction software system built with TypeScript, React, GraphQL, and PostgreSQL using Microsoft Rush monorepo management.

### [Getting Started](https://github.com/AuctionSoft/auctionsoftware/wiki)

### Core Services
- **api/**: GraphQL API server with Apollo Server, handles authentication, business logic
- **admin/**: React admin interface for auction management
- **front/**: Public-facing React site for bidders/users
- **mobile-apps/**: Expo React Native apps for iOS/Android bidders and catalogers
- **task/**: Background job processor for async operations
- **db/**: Database migrations, seeds, and schema management with Knex.js
- **libraries/**: 50+ shared packages for business logic, UI components, integrations

### Rush Monorepo Structure
- Use `rush update` to install dependencies (not npm install)
- Use `rush build` to compile TypeScript across all packages
- Each service/library has its own package.json with proper dependencies
- All packages follow `@snd/package-name` naming convention

### Essential Commands
```bash
# Setup and build
rush update             # Install dependencies
rush build              # Build all packages
rush start              # Start development servers (PM2)
rush stop               # Stop all services

# Database operations (dev when working on core, otherwise the custom client schema)
cd ./db && node index.js up core && node index.js up dev    # Run migrations
cd ./db && node index.js down core && node index.js down dev # Rollback
```


### Environment Configuration
- **Development**: Uses `ecosystem-development.json` for PM2, direct Node.js execution
- **Database**: Multi-schema PostgreSQL (`core` + client schemas like `dev`)
- Services communicate via GraphQL subscriptions and Redis pub/sub

## Key Patterns & Conventions

### Database Schema Pattern
- **Core schema**: Shared tables across all clients
- **Client schemas** (e.g., `dev`): Inherit from core using PostgreSQL table inheritance
- **Custom fields**: Prefix with `_` (single client) or `__` (extensible base)
- **Migrations**: Separate core and client migrations, use `exports.schema = 'dev'`

### GraphQL Architecture
- Apollo Server with custom plugins for validation, security, alerts
- Resolvers organized by domain in `api/src/`
- Type-safe generated schemas with custom directives
- Real-time subscriptions via GraphQL WebSockets
- Caching with Apollo InMemoryCache and Redis

### React/Frontend Patterns
- Server-side rendering (SSR) with Loadable Components
- Redux for state management (avoid for new features), Apollo Client for GraphQL
- React Router 5.x with custom routing patterns
- Custom component library in `libraries/shared-components/`
- Override system using `@snd/overrides` decorators for customization

### Authentication & Authorization
- Session-based auth with Redis storage
- Role-based permissions with hierarchical structure
- JWT tokens for mobile apps and external integrations
- SSO support via `@snd/as2-sso` library or OIDC

### File Organization
- TypeScript strict mode enabled across all packages
- Absolute imports using `@` prefix (e.g., `@components`, `@lib`)
- Shared types in `types/` directories per service
- Common utilities in `libraries/` packages

## Critical Integration Points

### Service Communication
- **API ↔ Database**: Knex.js query builder with connection pooling
- **Frontend ↔ API**: Apollo Client with authentication headers
- **Task Queue**: RabbitMQ for background jobs via `@snd/as-tasks-queue`
- **File Storage**: Configurable backends (local, S3, etc.) via `@snd/as-file-storage`

### Override System
Use `@override('path/to/plugins')` decorator to allow class customization:
```typescript
import { override, before, after } from '@snd/overrides';

@override('plugins/auctions')
export class AuctionComponent {
  @before('submitBid')
  validateBidAmount() { /* custom logic */ }
}
```

### Environment Variables
Check `ecosystem-development.json` and `.kube/as2-configmap.yaml` for service configuration. Key patterns:
- `SND_DB_*`: Database connection settings
- `*_DOMAIN`, `*_PATH`: Service routing configuration  
- `NODE_ENV`: Environment detection (development/production)

## Development Guidelines

### When Adding Features
1. Create shared logic in appropriate `libraries/` package
2. Add GraphQL schema to `api/src/` with resolvers
3. Update both admin, front, and mobile app UIs as needed
4. Write database migrations with proper schema inheritance
5. Update permissions system if needed

### When Debugging
- Check PM2 logs: `pm2 logs [service-name]`
- GraphQL Playground available in development at API endpoint
- Redis debugging via `@snd/as-redis` utilities
- Database schema introspection via `@snd/as-extended-graphql-fields`

### Common Gotchas
- Always use Rush commands, not direct npm
- Database operations require proper schema context setting
- Frontend builds require both server and client webpack configs
- Mobile apps operate outside the Rush mono-repo and still use npm
- Custom table inheritance means migrations must be carefully ordered

### Wiki & Documentation
Refer to the [AS2 Wiki](https://github.com/AuctionSoft/auctionsoftware/wiki) for detailed guides, API docs, and architecture deep-dives.
- [Creating a Hotfix](https://github.com/AuctionSoft/auctionsoftware/wiki/Creating-a-Hotfix)

This architecture enables white-label auction software deployment with extensive customization capabilities while maintaining code reuse and type safety across the entire stack.
