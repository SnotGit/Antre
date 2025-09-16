// AUTH DOMAIN EXPORTS

//======= SERVICES =======
export { AuthService } from './services/auth.service';
export { LoginService } from './services/login.service';
export { TokenService } from './services/token.service';
export { RegisterService } from './services/register.service';

//======= TYPES =======
export type { User } from './services/login.service';
export type { LoginResponse } from './services/login.service';
export type { RegisterRequest, RegisterResponse } from './services/register.service';
export type { TokenValidationResponse, TokenInfo } from './services/token.service';

//======= COMPONENTS =======
export { Auth } from './components/auth';

//======= ROUTES =======
export { routes as authRoutes } from './routes/auth.routes';