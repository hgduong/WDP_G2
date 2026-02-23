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

function authorizeRoles(roles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    // Chuẩn hóa role về chữ thường để so sánh
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map((r) => r.toLowerCase());

    console.log("Role từ JWT:", req.user.role); // log ra để debug

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
