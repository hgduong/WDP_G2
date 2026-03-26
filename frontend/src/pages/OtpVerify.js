import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { sendOtp, verifyOtp } from "../services/api";
import { toast } from "react-toastify";
import { UserContext } from "../context/UserContext";
import "../assets/styles/OtpVerify.css";

function OtpVerify() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const userContext = React.useContext(UserContext);
  
 
  const email = location.state?.email || searchParams.get("email");
  const purpose = location.state?.purpose || searchParams.get("purpose");
  const [isDisabled, setIsDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Mask email for privacy
  const maskEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    if (!domain) return email;
    const visibleChars = 2;
    if (username.length <= visibleChars) {
      return `${username[0]}***@${domain}`;
    }
    const masked = username.slice(0, visibleChars) + "***";
    return `${masked}@${domain}`;
  };

  // Check if OTP is valid (exactly 6 digits)
  const checkOtpValidity = (value) => {
    return /^\d{6}$/.test(value);
  };
  if (!email) {
    return (
      <div className="otp-error-container">
        <p className="otp-error-message">
          Không tìm thấy email để xác thực OTP. Vui lòng thử lại.
        </p>
      </div>
    );
  }

  // Gửi OTP về email
  const handleSendOtp = async () => {
    try {
      const res = await sendOtp(email);
      toast.success(res.data.message);
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
      toast.error(
        err.response?.data?.error || "OTP không đúng hoặc đã hết hạn",
      );
    }
  };

  // Xác nhận OTP
  const handleVerifyOtp = async () => {
    if (!checkOtpValidity(otp)) {
      setOtpError("Vui lòng nhập đủ 6 số");
      return;
    }

    try {
      const res = await verifyOtp(email, otp, purpose);
      toast.success(res.data.message);
      setMessage(res.data.message);
      setOtpError("");
      
      // Nếu là adminLogin, chuyển hướng đến admin dashboard
      if (purpose === "adminLogin") {
        // Lưu user vào context nếu có và chuyển hướng
        if (res.data.user && userContext) {
          userContext.login(res.data.user, () => {
            navigate("/admin/dashboard", { replace: true });
          });
        } else {
          // Nếu không có context, vẫn chuyển hướng (JWT đã được set trong cookie)
          setTimeout(() => {
            navigate("/admin/dashboard", { replace: true });
          }, 1000);
        }
      } else {
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1000);
      }
    } catch (err) {
      setOtpError(
        err.response?.data?.error || "OTP không đúng hoặc đã hết hạn",
      );
      toast.error(
        err.response?.data?.error || "OTP không đúng hoặc đã hết hạn",
      );
      setMessage("");
    }
  };

  return (
    <div className="otp-verify-container">
      <div className="otp-verify-wrapper">
        <h2 className="otp-verify-title">Xác thực OTP cho {maskEmail(email)}</h2>

        <div className="otp-verify-form">
          <div className="form-group">
            <label>Nhập mã OTP (6 số):</label>
            <div className="otp-input-group">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="otp-input"
                value={otp}
                placeholder="Nhập 6 số OTP"
                onChange={(e) => {
                  let value = e.target.value;

                  // Check for invalid characters first
                  if (/[^0-9]/.test(value)) {
                    // setOtpError("OTP chỉ được chứa số");
                    return;
                  }

                  // Check for negative
                  if (value.startsWith("-")) {
                    // setOtpError("OTP không được chứa số âm");
                    return;
                  }

                  // Check for whitespace
                  if (value.includes(" ")) {
                    // setOtpError("OTP không được chứa khoảng trắng");
                    return;
                  }

                  // Limit to 6 characters
                  value = value.slice(0, 6);

                  // Clear error if valid
                  setOtpError("");
                  setOtp(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otp.length === 6) {
                    handleVerifyOtp();
                  }
                }}
              />
            </div>
          </div>

          {/* {otpError && <p className="otp-message error">{otpError}</p>} */}
          {/* {message && !otpError && (
            <p className="otp-message success">{message}</p>
          )} */}

          <div className="otp-button-group">
            <button
              className="otp-send-btn"
              onClick={handleSendOtp}
              disabled={isDisabled}
            >
              {isDisabled ? `Gửi lại sau ${remainingTime}s` : "Gửi OTP"}
            </button>
            <button
              className="otp-verify-btn"
              onClick={handleVerifyOtp}
              disabled={!checkOtpValidity(otp)}
            >
              Xác nhận OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpVerify;
