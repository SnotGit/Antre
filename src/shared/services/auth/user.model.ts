export interface User {
  id: number;
  username: string;
  email: string;
  description?: string;
  avatar?: string;
  role: 'admin' | 'user';
  playerId?: string;
  playerDays?: number;
  createdAt: string;
}
