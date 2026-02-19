const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = req.cookies.jwt; // lấy token từ cookie

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }
    req.user = user; // gắn thông tin user vào request
    next();
  });
}

// Middleware kiểm tra role
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
