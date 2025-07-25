# replit.md

## Overview

This is a full-stack TikTok-like video sharing application built with a modern tech stack. The application allows users to authenticate, upload videos, interact with content through likes and comments, and discover new content through a personalized feed.

## User Preferences

Preferred communication style: Simple, everyday language.
Environment configuration: Use .env file exclusively for all environment variables, no Replit secrets.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React SPA with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit OpenID Connect integration with session management
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS

## Key Components

### Frontend Architecture
- **React Router**: Using `wouter` for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Pre-built shadcn/ui components with consistent design system
- **Styling**: Tailwind CSS with custom TikTok-inspired color palette
- **Mobile-First Design**: Responsive components optimized for mobile viewing

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Authentication Middleware**: Session-based auth using Replit's OpenID Connect
- **Database Layer**: Abstracted storage interface with in-memory fallback for development
- **Static File Serving**: Vite integration for development, static serving for production

### Database Schema
- **Users**: Profile information, follower/following counts, likes count
- **Videos**: Video metadata, URLs, engagement metrics
- **Comments**: User comments on videos with like counts
- **Likes**: User likes on videos and comments
- **Follows**: User follow relationships
- **Sessions**: Session storage for authentication (required for Replit Auth)

### API Structure
- `/api/auth/*` - Authentication endpoints (user info)
- `/api/videos/*` - Video CRUD operations, feed, likes, comments
- `/api/users/*` - User profiles and video listings
- All endpoints support proper error handling and authentication checks

## Data Flow

1. **Authentication Flow**: Users authenticate through Replit's OIDC provider, sessions stored in PostgreSQL
2. **Video Upload**: Users create videos with metadata, stored with engagement tracking
3. **Feed Generation**: Videos retrieved with pagination, enriched with user data and engagement metrics
4. **Real-time Interactions**: Likes, comments, and follows update immediately with optimistic UI updates
5. **Error Handling**: Comprehensive error boundaries with user-friendly messages and auto-retry logic

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and concurrent features
- **Express**: Backend web framework
- **TypeScript**: Type safety across the entire stack
- **Vite**: Build tool and development server

### Database & ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments

### Authentication
- **Replit Auth**: OpenID Connect integration with session management
- **Passport.js**: Authentication middleware
- **express-session**: Session management with PostgreSQL store

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds

## Deployment Strategy

The application is designed for deployment on Replit with the following considerations:

### Development
- Vite dev server with HMR for frontend development
- tsx for running TypeScript server code directly
- Environment variables for database and auth configuration

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Static serving: Express serves built frontend assets in production

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer URL (defaults to Replit's)

### Database Setup
- Drizzle migrations in `migrations/` directory
- Schema defined in `shared/schema.ts`
- Push schema changes with `npm run db:push`

The application supports both development and production modes with appropriate optimizations and error handling for each environment.