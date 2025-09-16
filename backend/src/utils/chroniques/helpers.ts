import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//======= USER SELECTION =======

export const userSelectFields = {
  id: true,
  username: true,
  email: true,
  description: true,
  avatar: true,
  role: true,
  playerId: true,
  playerDays: true,
  createdAt: true
};

//======= STORY RETRIEVAL =======

export const getUserStory = async (storyId: number, userId: number, status: 'DRAFT' | 'PUBLISHED') => {
  return await prisma.story.findFirst({
    where: { 
      id: storyId,
      userId: userId,
      status: status
    },
    select: {
      id: true,
      title: true,
      content: true
    }
  });
};

export const getStoryWithOwnership = async (storyId: number, userId: number) => {
  return await prisma.story.findFirst({
    where: { 
      id: storyId,
      userId: userId
    },
    select: {
      id: true,
      title: true,
      content: true,
      userId: true
    }
  });
};