
# AI-Powered Social Media Management Platform

A comprehensive social media management platform that leverages AI to help businesses and content creators streamline their social media presence across multiple platforms.

## 🚀 Features

### 🤖 AI-Powered Content Generation
- **Smart Content Creation**: Generate engaging posts tailored to your brand voice
- **Business Context Integration**: AI learns your business context for personalized content
- **Multi-Platform Optimization**: Content optimized for Twitter, LinkedIn, Instagram, and more
- **Content Refinement**: AI-powered editing and improvement suggestions

### 📅 Advanced Scheduling
- **Visual Calendar Interface**: Drag-and-drop post scheduling
- **Multi-Platform Publishing**: Schedule posts across all connected social accounts
- **Optimal Timing**: AI suggests best posting times based on audience engagement
- **Bulk Scheduling**: Upload and schedule multiple posts at once

### 📊 Analytics & Insights
- **Performance Tracking**: Monitor engagement, reach, and growth metrics
- **AI-Powered Insights**: Get actionable recommendations to improve performance
- **Cross-Platform Analytics**: Unified view of all your social media metrics
- **Custom Reports**: Generate detailed reports for stakeholders

### 🔗 Social Media Integration
- **OAuth Authentication**: Secure connection to social media accounts
- **Multi-Platform Support**: Twitter, LinkedIn, Instagram, Facebook, and more
- **Real-Time Sync**: Automatic synchronization of posts and engagement data
- **Account Management**: Easy switching between multiple social accounts

### 💬 AI Assistant
- **Interactive Chatbot**: Get help with content strategy and platform management
- **Quick Actions**: Perform common tasks through natural language commands
- **Content Suggestions**: AI-powered recommendations for trending topics
- **Strategy Guidance**: Expert advice on social media best practices

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **AI Integration**: Google AI (Genkit)
- **Caching**: Redis with Bull Queue for background jobs
- **Social APIs**: OAuth integration for multiple platforms

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance)
- **Redis** (for caching and job queues)
- **Social Media API Keys** (Twitter, LinkedIn, etc.)
- **Google AI API Key** (for AI features)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-social-media-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/social-media-platform

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret

# Redis
REDIS_URL=redis://localhost:6379

# Google AI
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Social Media APIs
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret

# App Configuration
NEXTAUTH_URL=http://localhost:9002
NODE_ENV=development
```

### 4. Setup Services

#### MongoDB
```bash
# Start MongoDB (if running locally)
mongod

# Or use MongoDB Atlas for cloud database
```

#### Redis
```bash
# Install and start Redis
# On macOS with Homebrew:
brew install redis
brew services start redis

# On Ubuntu:
sudo apt install redis-server
sudo systemctl start redis

# Or run setup script:
npm run setup:redis
```

### 5. Run the Application
```bash
# Development mode
npm run dev

# Development with background jobs
npm run dev:cron

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:9002`

## 📁 Project Structure

```
src/
├── ai/                     # AI integration and flows
│   ├── flows/             # AI workflow functions
│   └── dev.ts            # AI development server
├── app/                   # Next.js app directory
│   ├── api/              # API routes
│   ├── login/            # Authentication pages
│   ├── register/         
│   ├── ai-assistant/     # AI assistant page
│   ├── calendar/         # Scheduling interface
│   ├── connections/      # Social media connections
│   └── page.tsx         # Dashboard home
├── components/           # React components
│   ├── ai/              # AI-related components
│   ├── calendar/        # Calendar components
│   ├── dashboard/       # Dashboard widgets
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── lib/                 # Utility libraries
│   ├── auth.ts         # Authentication utilities
│   ├── cache.ts        # Redis caching
│   ├── queue.ts        # Background job queues
│   ├── scheduler.ts    # Post scheduling
│   └── social-media.ts # Social media integrations
├── models/             # Database models
└── types/              # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start AI development server
- `npm run setup:redis` - Setup Redis configuration

## 🔐 Authentication

The platform uses JWT-based authentication with the following features:

- **Secure Registration**: Password hashing with bcryptjs
- **Login/Logout**: JWT token management
- **Protected Routes**: Middleware for route protection
- **Social OAuth**: Integration with social media platforms

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## 🤖 AI Features

### Content Generation
```javascript
// Generate social media content
const content = await generateSocialMediaContent({
  topic: "Product launch",
  platform: "twitter",
  tone: "professional",
  businessContext: userContext
});
```

### AI Assistant
```javascript
// Chat with AI assistant
const response = await businessContextChat({
  message: "Help me create a content strategy",
  context: userBusinessContext
});
```

## 📊 Analytics Integration

The platform provides comprehensive analytics through:

- **Real-time Metrics**: Live engagement tracking
- **Historical Data**: Performance trends over time
- **AI Insights**: Automated recommendations
- **Custom Reports**: Exportable analytics reports

## 🔗 Social Media Integration

### Supported Platforms
- **Twitter/X**: Full API integration
- **LinkedIn**: Professional networking posts
- **Instagram**: Visual content management
- **Facebook**: Page and profile management

### OAuth Flow
1. User initiates connection
2. Redirect to platform OAuth
3. Secure token storage
4. API access for posting/analytics

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker
```dockerfile
# Dockerfile included for containerized deployment
docker build -t social-media-platform .
docker run -p 3000:3000 social-media-platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

## 🔄 Changelog

### v0.1.0 (Current)
- ✅ Initial platform setup
- ✅ AI-powered content generation
- ✅ Multi-platform social media integration
- ✅ Advanced scheduling system
- ✅ Analytics dashboard
- ✅ User authentication
- ✅ Modern responsive UI

### Upcoming Features
- 📱 Mobile app
- 🎨 Advanced content templates
- 📈 Enhanced analytics
- 🔄 Workflow automation
- 👥 Team collaboration features

---

**Built with ❤️ for social media professionals and content creators**
