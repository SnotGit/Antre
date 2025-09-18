declare global {
  namespace Express {
    interface Request {
      user: {
        userId: number;
      };
      storyId?: number;
      story?: {
        id: number;
        title: string;
        content: string;
        userId: number;
      };
    }
  }
}

export {};