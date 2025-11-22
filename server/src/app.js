import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mainRoutes from './routes/mainRoute.js';
import profileRoutes from './routes/profileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { setupWebSocket } from './websocket/sttWebSocket.js';
import { pool, testDBConnection } from './services/db.js'; 

// config the dotenv
dotenv.config();

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const CORS_OPTIONS = {
  origin: [
    process.env.FRONT_END_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(CORS_OPTIONS));

// Routes
app.use('/api', mainRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);

// Test the database connection when the server starts
// testDBConnection(pool);

// Start web socket
export const initializeWebSocket = (server) => {
  setupWebSocket(server);
};

export default app;