import React, { useState } from "react";
import { checkEmailExists } from "../services/api";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const handleSendOtp = async () => {
    try {
      const res = await checkEmailExists(email);
      navigate("/otp_verify", {
        state: { email: res.data.email, purpose: "forgotPassword" },
      });
    } catch (err) {
      setMessage(err.response?.data?.error || "Có lỗi xảy ra khi gửi OTP");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Quên mật khẩu</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>Nhập Gmail của bạn:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      <button onClick={handleSendOtp}>Tiếp tục</button>

      {message && <p style={{ marginTop: "15px", color: "blue" }}>{message}</p>}
    </div>
  );
}

export default ForgotPassword;
