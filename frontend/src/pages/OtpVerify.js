import React, { useState, useEffect } from "react";
import { useLocation,useNavigate  } from "react-router-dom";
import { sendOtp, verifyOtp } from "../services/api";

function OtpVerify() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const email = location.state?.email;
  const purpose = location.state?.purpose;
  const [isDisabled, setIsDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  if (!email) {
    return <p>Không tìm thấy email, vui lòng đăng ký lại.</p>;
  }

  // Gửi OTP về email
  const handleSendOtp = async () => {
    try {
      const res = await sendOtp(email);
      setMessage(res.data.message);
      setTimeout(() => {
        setMessage("");
      }, 5000);
      setIsDisabled(true);
      setRemainingTime(60);
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Có lỗi xảy ra khi gửi OTP");
    }
  };

  // Xác nhận OTP
  const handleVerifyOtp = async () => {
    try {
      const res = await verifyOtp(email, otp, purpose);
      setMessage(res.data.message);
      setShowModal(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "OTP không đúng hoặc đã hết hạn");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Xác thực OTP cho {email}</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>Nhập mã OTP (6 số):</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={handleSendOtp} disabled={isDisabled}>
          {isDisabled ? `Gửi lại sau ${remainingTime}s` : "Gửi OTP"}
        </button>
        <button onClick={handleVerifyOtp}>Xác nhận OTP</button>
      </div>

      {message && <p style={{ marginTop: "15px", color: "blue" }}>{message}</p>}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
              maxWidth: "300px",
            }}
          >
            <h3>Xác thực thành công!</h3>
            {/* <p>Tài khoản của bạn đã được kích hoạt.</p> */}
            <button
              onClick={() => navigate("/login")}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Quay về đăng nhập
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtpVerify;
