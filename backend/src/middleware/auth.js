import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { AppError } from '../utils/errors.js';
export function authenticate(req,res,next) {
 try {
  const header=req.headers.authorization;
  if(!header?.startsWith('Bearer ')) throw new AppError('Authentication required',401);
  const payload=jwt.verify(header.slice(7),process.env.JWT_SECRET);
  const user=db.prepare('SELECT id,name,email,role,company FROM users WHERE id=?').get(payload.sub);
  if(!user) throw new AppError('Account no longer exists',401);
  req.user=user; next();
 } catch(e) { next(e instanceof AppError?e:new AppError('Invalid or expired token',401)); }
}
export const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():next(new AppError('Forbidden: insufficient permissions',403));
