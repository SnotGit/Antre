import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth/auth.routes';
import userRoutes from './routes/user/user.routes';
import chroniquesRoutes from './routes/chroniques/chroniques.routes';
import marsballRoutes from './routes/marsball/marsball.routes';

const app = express();

//======= CORS MIDDLEWARE =======

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

//======= SECURITY MIDDLEWARE =======

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

//======= PARSING MIDDLEWARE =======

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//======= STATIC FILES =======

app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

//======= API ROUTES =======

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chroniques', chroniquesRoutes);
app.use('/api/marsball', marsballRoutes);

//======= HEALTH CHECK =======

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

//======= 404 HANDLER =======

app.use(/.*/, (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

export default app;