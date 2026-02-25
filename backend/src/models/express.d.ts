declare global {
  namespace Express {
    interface Request {
      user: {
        userId: number;
        role: string;
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