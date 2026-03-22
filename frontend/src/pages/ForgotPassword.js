import React, { useState } from "react";
import { checkEmailExists } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../assets/styles/ForgotPassword.css";
import { toast } from "react-toastify";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const handleSendOtp = async () => {
    try {
      const res = await checkEmailExists(email);
      if (!res.data.exists) {
        toast.error(res.data.message);
        return;
      }
      toast.success(res.data.message);
      navigate(
        "/otp_verify",
        { replace: true },
        {
          state: { email: res.data.email, purpose: "forgotPassword" },
        },
      );
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại sau ",
      );
      toast.error(
        err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại sau",
      );
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Quên mật khẩu</h2>

      <div className="form-group">
        <label>Nhập Gmail của bạn:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          required
          pattern="[a-z0-9._%+-]+@gmail\.com$"
        />
      </div>

      <button className="submit-button" onClick={handleSendOtp}>
        Tiếp tục
      </button>

      {/* {message && <p className="message error">{message}</p>} */}
    </div>
  );
}

export default ForgotPassword;
