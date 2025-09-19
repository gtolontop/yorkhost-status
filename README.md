# Yorkhost Status Page

A comprehensive, real-time status monitoring system built with Next.js 14, featuring Discord OAuth authentication, PostgreSQL database, real-time updates, and a professional admin dashboard.

![Yorkhost Status](https://img.shields.io/badge/Status-Operational-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

## 🚀 Features

### 🌟 Core Features
- **Real-time Status Monitoring** - Live updates with WebSocket/Pusher integration
- **Multi-service Tracking** - HTTP/HTTPS, TCP, UDP port monitoring
- **Discord OAuth Authentication** - Secure admin access with role verification
- **Responsive Design** - Modern, clean UI with light/dark theme support
- **Professional Dashboard** - Comprehensive admin panel for service management

### 📊 Monitoring Capabilities
- **HTTP/HTTPS Checks** - Status code validation, response time tracking, SSL verification
- **TCP/UDP Port Monitoring** - Connection testing with configurable timeouts
- **Uptime Calculations** - 24h, 7d, 30d uptime percentages
- **Interactive Charts** - Historical uptime visualization with Chart.js
- **Incident Management** - Create, update, and track service incidents

### 🔐 Security & Admin
- **Discord Role-based Access** - Admin access limited to specific Discord role (ID: 2917266)
- **JWT Session Management** - Secure token-based authentication
- **Audit Logging** - Complete action tracking for compliance
- **Rate Limiting** - API protection against abuse

### ⚡ Real-time Features
- **Live Status Updates** - Instant notifications when service status changes
- **Incident Alerts** - Real-time incident creation and updates
- **Auto-refresh Dashboards** - Dynamic data updates without page reload

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   PostgreSQL     │────│   Pusher/WS     │
│   (Frontend)    │    │   (Database)     │    │ (Real-time)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Routes    │────│    Prisma ORM    │────│  Worker System  │
│  (Backend)      │    │   (Database)     │    │  (Monitoring)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Discord OAuth   │────│   JWT Sessions   │────│   Audit Logs    │
│ (Authentication)│    │   (Security)     │    │   (Tracking)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **SCSS Modules** for styling
- **Chart.js** for data visualization
- **Lucide React** for icons

### Backend
- **Next.js API Routes** (serverless)
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Zod** for validation

### Real-time
- **Pusher** for WebSocket connections
- **Custom Worker System** for monitoring

### Authentication
- **Discord OAuth2** integration
- **Role-based access control**
- **Secure session management**

## 📋 Prerequisites

- Node.js 18.17 or later
- PostgreSQL 13 or later
- Discord Application (for OAuth)
- Pusher account (for real-time features)

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd yorkhost-status
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/yorkhost_status"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
DISCORD_GUILD_ID="your-discord-server-id"
DISCORD_ROLE_ID="2917266"

# Pusher
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="us2"

# Public variables
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:push

# Seed sample data
npm run db:seed
```

### 5. Start Development Servers
```bash
# Start the Next.js app
npm run dev

# In another terminal, start the monitoring worker
npm run worker
```

## 🔑 Discord OAuth Setup

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:3000/api/auth/discord/callback`
5. Copy Client ID and Client Secret

### 2. Get Guild and Role IDs
1. Enable Developer Mode in Discord
2. Right-click your server → Copy Server ID (Guild ID)
3. Right-click the admin role → Copy Role ID

### 3. Configure OAuth Scopes
Required scopes:
- `identify` - Get user info
- `guilds` - Check server membership
- `guilds.members.read` - Verify user roles

## 📊 Monitoring Configuration

### Service Types Supported
- **HTTP/HTTPS** - Website and API monitoring
- **TCP** - Port connectivity testing  
- **UDP** - Network service monitoring

### Check Configuration Options
```typescript
{
  type: 'HTTP' | 'HTTPS' | 'TCP' | 'UDP',
  target: string,           // Domain or IP
  port?: number,            // For TCP/UDP checks
  timeout: number,          // Milliseconds
  interval: number,         // Seconds between checks
  retryAttempts: number,    // Retry count on failure
  expectedStatus?: number,  // HTTP status code
  expectedBody?: string,    // Response body validation
  headers?: object,         // Custom HTTP headers
  followRedirects?: boolean,// Follow HTTP redirects
  sslCheck?: boolean        // Validate SSL certificates
}
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Worker Deployment
Deploy the monitoring worker separately:

**Option 1: Render**
```dockerfile
# Dockerfile for worker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "worker"]
```

**Option 2: Fly.io**
```toml
# fly.toml
[processes]
worker = "npm run worker"
```

### Environment Variables for Production
```env
# Production database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Production domains
NEXTAUTH_URL="https://status.yorkhost.fr"

# Production Discord app
DISCORD_CLIENT_ID="production-client-id"
DISCORD_CLIENT_SECRET="production-client-secret"

# Production Pusher
PUSHER_APP_ID="production-app-id"
PUSHER_KEY="production-key"
PUSHER_SECRET="production-secret"
```

## 📖 API Documentation

### Public Endpoints
```
GET  /api/status              # Overall system status
GET  /api/machines            # List all machines and services
GET  /api/incidents           # List incidents
GET  /api/incidents/:id       # Get incident details
GET  /api/service/:id/history # Service uptime history
```

### Admin Endpoints (Require Authentication)
```
GET  /api/admin/dashboard     # Dashboard statistics
POST /api/admin/machines      # Create machine
POST /api/admin/services      # Create service
POST /api/admin/incidents     # Create incident
POST /api/admin/incidents/:id/updates # Add incident update
POST /api/check/:id/run       # Trigger manual check
```

### Authentication Endpoints
```
GET  /api/auth/discord        # Initiate Discord OAuth
GET  /api/auth/discord/callback # OAuth callback
POST /api/auth/logout         # Logout
GET  /api/auth/me             # Get current user
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🔧 Development

### Project Structure
```
yorkhost-status/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions and helpers
│   ├── styles/              # SCSS styles and design tokens
│   └── types/               # TypeScript type definitions
├── workers/                 # Background monitoring workers
├── prisma/                  # Database schema and migrations
├── tests/                   # Test files
└── docs/                    # Documentation
```

### Adding New Check Types
1. Extend `CheckType` enum in Prisma schema
2. Add check execution logic in `workers/monitor.ts`
3. Update admin UI forms for configuration
4. Add validation schemas

### Customizing Themes
Edit design tokens in `src/styles/tokens.scss`:
```scss
:root {
  --color-primary: #your-brand-color;
  --color-success: #your-success-color;
  // ... other tokens
}
```

## 🚨 Troubleshooting

### Common Issues

**Discord OAuth Fails**
- Verify Client ID/Secret are correct
- Check redirect URI matches exactly
- Ensure user has required role in Discord server

**Worker Not Monitoring**
- Check DATABASE_URL is accessible from worker
- Verify worker process is running
- Check worker logs for errors

**Real-time Updates Not Working**
- Verify Pusher credentials
- Check browser console for WebSocket errors
- Ensure CORS is configured for Pusher

**Database Connection Issues**
- Verify PostgreSQL is running
- Check connection string format
- Ensure database exists and user has permissions

### Logs and Debugging
```bash
# View worker logs
npm run worker

# Check database migrations
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use SCSS modules for styling
- Add tests for new functionality
- Update documentation for changes
- Follow existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord server
- Email: support@yorkhost.fr

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic monitoring system
- ✅ Discord authentication
- ✅ Real-time updates
- ✅ Admin dashboard

### Phase 2 (Next)
- 🔄 SMS/Email notifications
- 🔄 API webhooks
- 🔄 Maintenance windows
- 🔄 Performance metrics

### Phase 3 (Future)
- 🔄 Multi-tenant support
- 🔄 Advanced analytics
- 🔄 Custom branding
- 🔄 Mobile application

---

Built with ❤️ by the Yorkhost Team