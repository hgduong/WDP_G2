import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token"); // lấy token từ URL

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  if (!token) {
    return <p>Token không tồn tại hoặc không hợp lệ.</p>;
  }

  const validatePassword = (password) => {
    const trimmed = password.trimEnd();
    if (trimmed.length < 7) {
      return "Mật khẩu phải dài hơn 6 ký tự";
    }
    if (!/[A-Z]/.test(trimmed)) {
      return "Mật khẩu phải có ít nhất 1 chữ in hoa";
    }
    if (!/[0-9]/.test(trimmed)) {
      return "Mật khẩu phải có ít nhất 1 chữ số";
    }
    if (!/[^A-Za-z0-9]/.test(trimmed)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    }
    return null;
  };

  const handleResetPassword = async () => {
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const res = await resetPassword(token, newPassword);
      setMessage(res.data.message);

      // Sau khi đổi mật khẩu thành công → quay về login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Có lỗi xảy ra khi đặt lại mật khẩu",
      );
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Đặt lại mật khẩu</h2>
      <div style={{ marginBottom: "10px" }}>
        <label>Mật khẩu mới:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ flex: 1, padding: "8px", marginTop: "5px" }}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            style={{
              marginLeft: "5px",
              padding: "6px 10px",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showNewPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Xác nhận mật khẩu:</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ flex: 1, padding: "8px", marginTop: "5px" }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              marginLeft: "5px",
              padding: "6px 10px",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {showConfirmPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>
      <button
        onClick={handleResetPassword}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Đặt lại mật khẩu
      </button>
      {message && <p style={{ marginTop: "15px", color: "blue" }}>{message}</p>}
    </div>
  );
}

export default ResetPassword;
