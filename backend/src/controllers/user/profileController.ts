import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@shared/index';
import { handleError, sendNotFound } from '@utils/global/helpers';
import { userSelectFields } from '@utils/chroniques/helpers';

const prisma = new PrismaClient();

interface UpdateProfileRequest {
  username?: string;
  description?: string;
  avatar?: string;
  playerId?: string;
  playerDays?: number;
}

//======= GET PROFILE =======

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields
    });

    if (!user) {
      sendNotFound(res, 'Utilisateur non trouvé');
      return;
    }

    res.json({ user });

  } catch (error) {
    handleError(res, 'Erreur lors de la récupération du profil');
  }
};

//======= UPDATE PROFILE =======

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { username, description, avatar, playerId, playerDays }: UpdateProfileRequest = req.body;

    if (username && username.length < 3) {
      res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' });
      return;
    }

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
        return;
      }
    }

    const updateData: UpdateProfileRequest = {};
    if (username !== undefined) updateData.username = username;
    if (description !== undefined) updateData.description = description;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (playerId !== undefined) updateData.playerId = playerId;
    if (playerDays !== undefined) updateData.playerDays = playerDays;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSelectFields
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    handleError(res, 'Erreur lors de la mise à jour du profil');
  }
};