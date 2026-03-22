import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";
import { toast } from "react-toastify";
import "../assets/styles/ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token"); // lấy token từ URL

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      toast.error(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const res = await resetPassword(token, newPassword);
      toast.success(res.data.message);

      // Sau khi đổi mật khẩu thành công → quay về login
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Có lỗi xảy ra khi đặt lại mật khẩu",
      );
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Đặt lại mật khẩu</h2>
      <div className="reset-password-field">
        <label>Mật khẩu mới:</label>
        <div className="password-input-wrapper">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="toggle-password-btn"
          >
            {showNewPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>
      <div className="reset-password-field">
        <label>Xác nhận mật khẩu:</label>
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="toggle-password-btn"
          >
            {showConfirmPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>
      <button
        onClick={handleResetPassword}
        className="reset-password-submit-btn"
      >
        Đặt lại mật khẩu
      </button>
    </div>
  );
}

export default ResetPassword;
