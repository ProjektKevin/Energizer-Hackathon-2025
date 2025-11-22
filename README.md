# Energizer Hackathon 2025 - Nutrition Tracking Application

## Overview

A full-stack nutrition tracking application with AI-powered voice assistance. This application allows users to track their food intake, search for nutritional information, and interact with an AI nutrition assistant through voice commands and camera integration. Users can log meals, view statistics, and receive personalized nutrition guidance through an intuitive interface.

### Key Features

- **AI Voice Assistant**: Real-time voice interaction with multimodal AI for nutrition guidance
- **Food Logging**: Track daily food intake with detailed nutritional information
- **Food Search**: Browse and search a comprehensive food database
- **Camera Integration**: Capture food images for AI analysis
- **Statistics Dashboard**: Visualize nutrition data and track progress
- **User Authentication**: Secure login and registration system
- **Profile Management**: Personalized user profiles and preferences

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **ShadCN UI** - Component library with Radix UI primitives
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **LameJS** - Audio encoding

### Backend
- **Express.js 5** - Web application framework
- **PostgreSQL** - Primary database
- **Supabase** - Backend-as-a-Service for database and storage
- **OpenAI API** - AI-powered nutrition assistance
- **AssemblyAI** - Speech-to-text conversion
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Sharp** - Image processing

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Supabase account (for backend services)
- OpenAI API key
- AssemblyAI API key

## Environment Variables

Create `.env` files in both client and server directories:

### Client `.env`
```
VITE_API_URL=http://localhost:8080
```

### Server `.env`
```
DATABASE_URL=your_postgresql_connection_string
BACK_END_PORT=8080
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
JWT_SECRET=your_jwt_secret
```

## How to Run

### Client Side

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The client will run on `http://localhost:5173` by default.

### Server Side

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:8080` by default.

## Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Project Structure

```
Energizer-Hackathon-2025/
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.jsx         # Main application component
│   └── package.json
├── server/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic services
│   └── package.json
└── README.md
```

## Features Overview

### Authentication
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes on both frontend and backend

### Food Tracking
- Log daily meals with detailed information
- Search comprehensive food database
- View nutritional breakdown
- Track calories and macronutrients

### AI Nutrition Assistant
- Voice-activated AI assistant
- Real-time speech recognition
- Text-to-speech responses
- Camera integration for food image analysis
- Context-aware nutritional guidance

### Statistics & Analytics
- Daily, weekly, and monthly nutrition tracking
- Visual charts and graphs
- Progress monitoring
- Personalized insights

## License

This project was created for the Energizer Hackathon 2025.
