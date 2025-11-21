import app, { initializeWebSocket } from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const PORT = process.env.BACK_END_PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});

// Setup WebSocket
initializeWebSocket(server);