import dotenv from 'dotenv';

//======= ENVIRONMENT =======

dotenv.config();

//======= DEBUG IMPORTS =======

console.log('Starting server...');

try {
  console.log('Importing app...');
  const app = require('./app').default;
  
  console.log('App imported successfully');
  
  //======= CONFIGURATION =======
  
  const PORT = process.env.PORT || 3000;
  
  //======= SERVER START =======
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('Système Opérationnel');
    console.log('Bienvenue Terraformeur !');
  });
  
} catch (error) {
  console.error('ERROR STARTING SERVER:', error);
  process.exit(1);
}