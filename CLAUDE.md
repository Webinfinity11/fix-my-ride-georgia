# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Installation
- `npm i` - Install dependencies

## Architecture Overview

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Maps**: Leaflet + React Leaflet
- **Forms**: React Hook Form + Zod validation

### Project Structure
This is a car repair service marketplace connecting customers with mechanics in Georgia.

**Key Domain Models:**
- **Users**: Three roles - customer, mechanic, admin
- **Services**: Mechanics offer services (mechanic_services table)
- **Bookings**: Customers book services from mechanics
- **Chat**: Real-time messaging system between users
- **Reviews**: Service and mechanic reviews
- **Location**: Integrated with Georgian cities/districts

**Main Pages:**
- `/` - Homepage with service search
- `/services` - Browse all services
- `/mechanic` - Browse mechanics
- `/dashboard/*` - Role-based dashboards (customer/mechanic/admin)
- `/chat` - Chat system
- `/book` - Service booking flow

### Database Schema
The application uses Supabase with comprehensive type definitions in `src/integrations/supabase/types.ts`. Key relationships:
- profiles → mechanic_profiles (1:1)
- mechanic_profiles → mechanic_services (1:many)
- bookings connects users, mechanics, and services
- Chat system with rooms, participants, and messages

### Authentication & Context
- AuthContext provides user authentication state
- ChatContext manages real-time chat functionality
- Role-based access control (customer/mechanic/admin)

### UI Components
- Uses shadcn/ui component library in `src/components/ui/`
- Custom components organized by feature (booking/, dashboard/, forms/, etc.)
- Responsive design with mobile-first approach

### Key Features
- **Service Discovery**: Search and filter mechanics/services by location, category
- **Booking System**: Complete booking flow with scheduling
- **Chat System**: Real-time messaging with file uploads
- **Admin Panel**: User/service/booking management
- **SEO**: Dynamic sitemap generation and metadata management
- **Maps Integration**: Location selection and display

### Development Notes
- Uses Lovable.dev for rapid prototyping (see README.md)
- Hot reload enabled for development
- TypeScript strict mode enabled
- Path aliasing: `@/` maps to `src/`
- Mobile responsive with bottom navigation
- Dark mode support via next-themes

### Important Patterns
- Database queries use Supabase client with TypeScript types
- Forms use React Hook Form with Zod validation
- Real-time features use Supabase subscriptions
- Image/video uploads to Supabase storage buckets
- SEO optimization with React Helmet Async