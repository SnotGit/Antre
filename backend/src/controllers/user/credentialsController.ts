import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '@models/shared';
import { handleError, sendError, sendSuccess } from '@utils/global/helpers';

const prisma = new PrismaClient();

interface UpdateEmailRequest {
  newEmail: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

//======= UPDATE EMAIL =======

export const updateEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { newEmail }: UpdateEmailRequest = req.body;

    if (!newEmail) {
      sendError(res, 'Nouvel email requis', 400);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      sendError(res, 'Format d\'email invalide', 400);
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: newEmail,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      sendError(res, 'Cet email est déjà utilisé', 409);
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail }
    });

    sendSuccess(res, 'Email mis à jour avec succès');

  } catch (error) {
    handleError(res, 'Erreur lors de la mise à jour de l\'email');
  }
};

//======= CHANGE PASSWORD =======

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    if (!currentPassword || !newPassword) {
      sendError(res, 'Mot de passe actuel et nouveau mot de passe requis', 400);
      return;
    }

    if (newPassword.length < 8) {
      sendError(res, 'Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      sendError(res, 'Mot de passe actuel incorrect', 401);
      return;
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    sendSuccess(res, 'Mot de passe modifié avec succès');

  } catch (error) {
    handleError(res, 'Erreur lors de la modification du mot de passe');
  }
};