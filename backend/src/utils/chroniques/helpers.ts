import { prisma } from '@db';

//======= STORY RETRIEVAL =======

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
