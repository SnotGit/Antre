import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@shared/index';
import { handleError, sendNotFound } from '@utils/global/helpers';
import { userSelectFields } from '@utils/chroniques/helpers';

const prisma = new PrismaClient();

//======= VALIDATE TOKEN =======

export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields
    });

    if (!user) {
      sendNotFound(res, 'Utilisateur non trouvé');
      return;
    }

    res.json({ 
      message: 'Token valide',
      user 
    });

  } catch (error) {
    handleError(res, 'Erreur lors de la validation du token');
  }
};