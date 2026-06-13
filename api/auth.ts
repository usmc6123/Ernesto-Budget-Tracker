import jwt from 'jsonwebtoken';
import { handleError } from './shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(45).end('Method Not Allowed');
  }
  
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password === 'password123') {
      const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
      const token = jwt.sign({ uid: 'reyes-budget-uid' }, secret, { expiresIn: '30d' });
      return res.status(200).json({ token, uid: 'reyes-budget-uid' });
    } else {
      return res.status(401).json({ error: 'Incorrect credentials' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}
