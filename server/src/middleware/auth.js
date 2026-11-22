import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';

export const COOKIE = 'session';

export function setSession(res, userId) {
  const token = jwt.sign({ uid: userId.toString() }, config.jwtSecret, { expiresIn: '30d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 30 * 24 * 3600 * 1000,
  });
}

export async function requireAuth(req, res, next) {
  try {
    const { uid } = jwt.verify(req.cookies[COOKIE] || '', config.jwtSecret);
    const user = await User.findById(uid);
    if (!user) return res.status(401).json({ error: 'Not logged in' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Not logged in' });
  }
}
