import { keyManager } from '../config/keys.js';
import rateLimit from 'express-rate-limit';

export const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // if (!apiKey || !keyManager.validateKey(apiKey)) {
  //   return res.status(401).json({ error: 'Invalid API key' });
  // }
  
  keyManager.incrementRequestCount(apiKey);
  next();
};

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});