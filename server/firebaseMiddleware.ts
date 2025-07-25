import type { Request, Response, NextFunction } from 'express';

// Simple Firebase auth middleware using user ID passed from client
export const requireFirebaseAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'] as string;
  
  if (!authHeader || !authHeader.startsWith('Bearer ') || !userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Store user ID in request for use in route handlers
  (req as any).userId = userId;
  next();
};