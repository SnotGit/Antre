const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//============ MIDDLEWARES ============

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

//============ FICHIERS STATIQUES ============

app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));

//============ ROUTES AUTHENTIFICATION ============

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

//============ ROUTES UTILISATEUR ============

const userRoutes = require('./routes/user.routes');
app.use('/api/user', userRoutes);

//============ ROUTES STORIES PRIVÉES ============

const privateStoriesRoutes = require('./routes/privateStories.routes');
app.use('/api/private-stories', privateStoriesRoutes);

//============ ROUTES STORIES PUBLIQUES ============

const publicStoriesRoutes = require('./routes/publicStories.routes');
app.use('/api/public-stories', publicStoriesRoutes);

//============ ROUTE DE TEST ============

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'L\'Antre API fonctionne !', 
    timestamp: new Date().toISOString(),
    version: '3.0'
  });
});

//============ DÉMARRAGE SERVEUR ============

app.listen(PORT, () => {
  console.log(`🚀 L'Antre API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 Architecture API Corrigée:`);
  console.log(`   🔐 AUTHENTIFICATION:`);
  console.log(`     - POST /api/auth/register`);
  console.log(`     - POST /api/auth/login`);
  console.log(`     - GET  /api/auth/validate`);
  console.log(`   👤 UTILISATEUR:`);
  console.log(`     - GET  /api/user/profile`);
  console.log(`     - PUT  /api/user/profile`);
  console.log(`     - PUT  /api/user/email`);
  console.log(`     - POST /api/user/upload-avatar`);
  console.log(`     - PUT  /api/user/change-password`);
  console.log(`   🔒 STORIES PRIVÉES:`);
  console.log(`     - GET  /api/private-stories/stats`);
  console.log(`     - GET  /api/private-stories/drafts`);
  console.log(`     - GET  /api/private-stories/published`);
  console.log(`     - GET  /api/private-stories/resolve/:title`);
  console.log(`     - GET  /api/private-stories/edit/:id`);
  console.log(`     - POST /api/private-stories/draft`);
  console.log(`     - PUT  /api/private-stories/draft/:id`);
  console.log(`     - POST /api/private-stories/publish/:id`);
  console.log(`     - POST /api/private-stories/update/:id`);
  console.log(`     - DELETE /api/private-stories/story/:id`);
  console.log(`     - POST /api/private-stories/story/:id/like`);
  console.log(`   🌍 STORIES PUBLIQUES:`);
  console.log(`     - GET  /api/public-stories/stories`);
  console.log(`     - GET  /api/public-stories/story/:id`);
  console.log(`     - GET  /api/public-stories/user/:id/stories`);
  console.log(`     - GET  /api/public-stories/user/:id/profile`);
  console.log(`     - GET  /api/public-stories/resolve/:username`);
  console.log(`     - GET  /api/public-stories/resolve/:username/:title`);
});