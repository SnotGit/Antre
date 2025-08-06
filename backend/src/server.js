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

const authRoutes = require('./routes/auth/auth.routes');
app.use('/api/auth', authRoutes);

//============ ROUTES UTILISATEUR ============

const userRoutes = require('./routes/user/user.routes');
app.use('/api/user', userRoutes);

//============ ROUTES CHRONIQUES ============

const chroniquesRoutes = require('./routes/chroniques/chroniques.routes');
app.use('/api/chroniques', chroniquesRoutes);

//============ ROUTE DE TEST ============

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'L\'Antre API fonctionne !', 
    timestamp: new Date().toISOString(),
    version: '4.0 - Architecture Refactorisée'
  });
});

//============ DÉMARRAGE SERVEUR ============

app.listen(PORT, () => {
  console.log(`🚀 L'Antre API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 Architecture API Refactorisée (1 route = 1 responsabilité):`);
  console.log(`   🔐 AUTHENTIFICATION:`);
  console.log(`     - POST /api/auth/register`);
  console.log(`     - POST /api/auth/login`);
  console.log(`     - GET  /api/auth/validate`);
  console.log(`   👤 PROFIL UTILISATEUR:`);
  console.log(`     - POST /api/user/profile/avatar`);
  console.log(`     - GET  /api/user/profile/avatar`);
  console.log(`     - PUT  /api/user/profile/avatar`);
  console.log(`     - GET  /api/user/profile/username`);
  console.log(`     - PUT  /api/user/profile/username`);
  console.log(`     - GET  /api/user/profile/description`);
  console.log(`     - PUT  /api/user/profile/description`);
  console.log(`     - GET  /api/user/profile/playerId`);
  console.log(`     - PUT  /api/user/profile/playerId`);
  console.log(`     - GET  /api/user/profile/playerDays`);
  console.log(`     - PUT  /api/user/profile/playerDays`);
  console.log(`   🔑 IDENTIFIANTS UTILISATEUR:`);
  console.log(`     - PUT  /api/user/credentials/email`);
  console.log(`     - PUT  /api/user/credentials/password`);
  console.log(`   📊 STATISTIQUES UTILISATEUR:`);
  console.log(`     - GET  /api/user/stats`);
  console.log(`   ❤️  LIKES UTILISATEUR:`);
  console.log(`     - GET  /api/user/likes/story/:id/count`);
  console.log(`     - GET  /api/user/likes/user/:userId/total`);
  console.log(`     - GET  /api/user/likes/story/:id/status`);
  console.log(`     - POST /api/user/likes/story/:id/toggle`);
  console.log(`   📚 CHRONIQUES PUBLIQUES:`);
  console.log(`     - GET  /api/chroniques/public/stories`);
  console.log(`     - GET  /api/chroniques/public/story/:id`);
  console.log(`     - GET  /api/chroniques/public/user/:userId/stories`);
  console.log(`     - POST /api/chroniques/public/story/:id/like`);
  console.log(`   🔒 CHRONIQUES PRIVÉES:`);
  console.log(`     - GET  /api/chroniques/private/stats`);
  console.log(`     - GET  /api/chroniques/private/drafts`);
  console.log(`     - GET  /api/chroniques/private/published`);
  console.log(`     - GET  /api/chroniques/private/draft/:id`);
  console.log(`     - GET  /api/chroniques/private/published/:id`);
  console.log(`     - POST /api/chroniques/private/draft`);
  console.log(`     - PUT  /api/chroniques/private/draft/:id`);
  console.log(`     - POST /api/chroniques/private/publish/:id`);
  console.log(`     - PUT  /api/chroniques/private/story/:id`);
  console.log(`     - DELETE /api/chroniques/private/story/:id`);
});