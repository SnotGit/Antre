import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth/auth.routes';
import userRoutes from './routes/user/user.routes';
import chroniquesRoutes from './routes/chroniques/chroniques.routes';

const app = express();

//======= SECURITY MIDDLEWARE =======

app.use(helmet());
app.use(cors());

//======= PARSING MIDDLEWARE =======

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//======= STATIC FILES =======

app.use('/uploads', express.static('uploads'));

//======= API ROUTES =======

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chroniques', chroniquesRoutes);

//======= HEALTH CHECK =======

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

//======= 404 HANDLER =======

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

export default app;