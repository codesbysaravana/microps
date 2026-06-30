import dotenv from 'dotenv';
import app from './app';

dotenv.config();

// Use port 8000 to avoid conflict with the learning server (which uses 5000)
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`[Backend API] Server is running on http://localhost:${PORT}`);
});
