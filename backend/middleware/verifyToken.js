import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
            roll_no: decoded.roll_no || decoded.id,
            userType: decoded.userType,
            email: decoded.email
        };

        console.log('Decoded token:', decoded);
        console.log('User set in request:', req.user);
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default verifyToken;
