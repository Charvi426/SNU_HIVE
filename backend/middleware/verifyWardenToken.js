import jwt from 'jsonwebtoken';

const verifyWardenToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is a warden token by looking for warden_id
    if (!decoded.warden_id) {
      return res.status(403).json({ message: 'Not authorized as warden' });
    }

    // Add the warden information to the request object
    req.warden = decoded;
    next();
  } catch (err) {
    console.error('Warden token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default verifyWardenToken;