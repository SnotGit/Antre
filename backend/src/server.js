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

//============ ROUTES STORIES PUBLIQUES ============

const usersStoriesRoutes = require('./routes/usersStories.routes');
app.use('/api/users/stories', usersStoriesRoutes);

//============ ROUTES STORIES PRIVÉES ============

const userStoriesRoutes = require('./routes/userStories.routes');
app.use('/api/user/stories', userStoriesRoutes);

//============ ROUTES CHRONIQUES (legacy) ============

const publicStoriesRoutes = require('./routes/publicStories.routes');
app.use('/api/public-stories', publicStoriesRoutes);

//============ ROUTE DE TEST ============

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'L\'Antre API fonctionne !', 
    timestamp: new Date().toISOString(),
    version: '4.0.0'
  });
});

//============ DÉMARRAGE SERVEUR ============

app.listen(PORT, () => {
  console.log(`🚀 L'Antre API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 Architecture API Refactorisée:`);
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
  console.log(`   🌍 STORIES PUBLIQUES (users):`);
  console.log(`     - GET  /api/users/stories/:id (consultation histoire)`);
  console.log(`     - GET  /api/users/stories/find/:username/:title (résolution titre→ID)`);
  console.log(`   🔒 STORIES PRIVÉES (user):`);
  console.log(`     - GET  /api/user/stories/stats`);
  console.log(`     - GET  /api/user/stories/drafts`);
  console.log(`     - GET  /api/user/stories/published`);
  console.log(`     - GET  /api/user/stories/draft/:id (récupérer brouillon)`);
  console.log(`     - GET  /api/user/stories/published-to-draft/:id (créer draft depuis publiée)`);
  console.log(`     - GET  /api/user/stories/find/:title (résolution titre→ID personnel)`);
  console.log(`     - POST /api/user/stories/draft (créer brouillon)`);
  console.log(`     - PUT  /api/user/stories/draft/:id (sauvegarder brouillon)`);
  console.log(`     - POST /api/user/stories/publish/:id (publier)`);
  console.log(`     - POST /api/user/stories/republish/:id (republier)`);
  console.log(`     - DELETE /api/user/stories/cancel/:id (annuler nouvelle)`);
  console.log(`     - DELETE /api/user/stories/draft/:id (supprimer brouillon)`);
  console.log(`     - POST /api/user/stories/like/:id (liker)`);
});