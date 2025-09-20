import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { handleError, sendError } from '@utils/global/helpers';

const prisma = new PrismaClient();

interface LoginRequest {
  email: string;
  password: string;
}

import { getJwtSecret } from './jwtConfig';

//======= LOGIN =======

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      sendError(res, 'Email et mot de passe sont requis', 400);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        description: true,
        avatar: true,
        role: true,
        playerId: true,
        playerDays: true,
        createdAt: true
      }
    });

    if (!user) {
      sendError(res, 'Email ou mot de passe incorrect', 401);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      sendError(res, 'Email ou mot de passe incorrect', 401);
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const { passwordHash, ...userData } = user;

    res.json({
      message: 'Connexion réussie',
      token: token,
      user: userData
    });

  } catch (error) {
    handleError(res, 'Erreur lors de la connexion');
  }
};