import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { handleError, sendError } from '@utils/global/helpers';
import { userSelectFields } from '@utils/chroniques/helpers';

const prisma = new PrismaClient();

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  description?: string;
}

//======= REGISTER =======

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, description }: RegisterRequest = req.body;

    if (!username || !email || !password) {
      sendError(res, 'Nom d\'utilisateur, email et mot de passe sont requis', 400);
      return;
    }

    if (username.length < 3) {
      sendError(res, 'Le nom d\'utilisateur doit contenir au moins 3 caractères', 400);
      return;
    }

    if (password.length < 8) {
      sendError(res, 'Le mot de passe doit contenir au moins 8 caractères', 400);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendError(res, 'Format d\'email invalide', 400);
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        sendError(res, 'Cet email est déjà utilisé', 409);
        return;
      }
      if (existingUser.username === username) {
        sendError(res, 'Ce nom d\'utilisateur est déjà pris', 409);
        return;
      }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        description: description || ''
      },
      select: userSelectFields
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token: token,
      user: user
    });

  } catch (error) {
    handleError(res, 'Erreur lors de l\'inscription');
  }
};