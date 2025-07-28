import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import mongoose from 'mongoose';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    if (!decoded.id) {
      throw new Error('Invalid token payload');
    }
    req.user = { _id: new mongoose.Types.ObjectId(decoded.id) } as IUser;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid', error: (err as Error).message });
  }
};

export default authMiddleware;