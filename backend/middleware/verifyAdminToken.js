import jwt from 'jsonwebtoken';

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.d_name) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    req.admin = decoded; 
    next();
  } catch (err) {
    console.error('Admin token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default verifyAdminToken;
