import dotenv from 'dotenv';
import app from './app';

//======= ENVIRONMENT =======

dotenv.config();

//======= CONFIGURATION =======

const PORT = process.env.PORT || 3000;

//======= SERVER START =======

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});