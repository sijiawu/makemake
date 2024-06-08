const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  const userIdHeader = req.header('x-user-id');

  console.log('Received token:', token); // Log received token
  console.log('Received user ID from header:', userIdHeader); // Log received user ID

  if (!token) {
    console.log('No token, authorization denied'); // Log missing token
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded.user;
    req.user.id = userIdHeader;

    console.log('Decoded user:', req.user); // Log decoded user
    next();
  } catch (err) {
    console.log('Token is not valid:', err.message); // Log invalid token
    res.status(401).json({ msg: 'Token is not valid' });
  }
};