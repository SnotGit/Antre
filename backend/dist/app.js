"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user/user.routes"));
const chroniques_routes_1 = __importDefault(require("./routes/chroniques/chroniques.routes"));
const marsball_routes_1 = __importDefault(require("./routes/marsball/marsball.routes"));
const app = (0, express_1.default)();
//======= CORS MIDDLEWARE =======
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
//======= SECURITY MIDDLEWARE =======
app.use((0, helmet_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
//======= STATIC FILES =======
app.use('/uploads', express_1.default.static('uploads', {
    setHeaders: (res, path, stat) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Access-Control-Allow-Origin', '*');
    }
}));
//======= API ROUTES =======
app.use('/api/auth', auth_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/chroniques', chroniques_routes_1.default);
app.use('/api/marsball', marsball_routes_1.default);
//======= HEALTH CHECK =======
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
//======= 404 HANDLER =======
app.use(/.*/, (req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});
exports.default = app;
