import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  requestStaffLoginOtp,
  verifyStaffLoginOtp,
} from "../../services/api";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/StaffLogin.css";

const STAFF_ROLES = ["Staff", "Admin"];

function StaffLogin() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, role, isAuthReady } = useContext(UserContext);

  // Auto redirect if already logged in as Staff/Admin
  React.useEffect(() => {
    if (isAuthReady && user && ["Staff", "Admin"].includes(role)) {
      navigate(role === "Admin" ? "/admin/dashboard" : "/staff/dashboard", { replace: true });
    }
  }, [user, role, isAuthReady, navigate]);

  const requestOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await requestStaffLoginOtp({ email, password });
      setOtpRequested(true);
      setOtp("");
      setMessage(result?.message || "Mã OTP đăng nhập đã được gửi qua Gmail.");
    } catch (err) {
      setError(err?.message || "Không gửi được OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    await requestOtp();
  };

  const handleResendOtp = async () => {
    await requestOtp();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await verifyStaffLoginOtp({ email, otp });
      const userRole = result?.data?.user?.role;

      if (!STAFF_ROLES.includes(userRole)) {
        setError("Tài khoản không thuộc nhóm staff.");
        return;
      }

      login(result?.data?.user, () => {
        // Redirection logic is now more robust with the isAuthReady check in ProtectedRoute
        navigate(userRole === "Admin" ? "/admin/dashboard" : "/staff/dashboard", { replace: true });
      });
    } catch (err) {
      const errorMessage = err?.message || "Xác thực OTP thất bại.";
      setError(errorMessage);

      if (
        errorMessage.toLowerCase().includes("hết hạn") ||
        errorMessage.toLowerCase().includes("het han") ||
        errorMessage.toLowerCase().includes("háº¿t háº¡n")
      ) {
        setMessage("Mã OTP đã hết hạn. Vui lòng bấm gửi lại OTP để nhận mã mới.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <h1>Đăng nhập staff</h1>
        <p>
          Staff mới đăng ký cần được admin duyệt. Sau đó mỗi lần đăng nhập sẽ
          dùng email, mật khẩu và OTP xác nhận.
        </p>

        <form
          onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp}
          className="staff-login-form"
        >
          <label htmlFor="staff-email">Email</label>
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@cinema.com"
            required
            disabled={otpRequested}
          />

          {!otpRequested ? (
            <>
              <label htmlFor="staff-password">Mật khẩu</label>
              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
            </>
          ) : null}

          {otpRequested ? (
            <>
              <label htmlFor="staff-otp">Mã OTP</label>
              <input
                id="staff-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập 6 chữ số"
                maxLength="6"
                required
              />
            </>
          ) : null}

          {message ? <p className="staff-login-message">{message}</p> : null}
          {error ? <p className="staff-login-error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : otpRequested
                ? "Xác nhận OTP"
                : "Gửi mã OTP"}
          </button>

          {otpRequested ? (
            <div className="staff-login-actions">
              <button
                type="button"
                className="secondary"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Gửi lại OTP
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setOtpRequested(false);
                  setOtp("");
                  setPassword("");
                  setError("");
                  setMessage("");
                }}
                disabled={loading}
              >
                Đổi email khác
              </button>
            </div>
          ) : null}
        </form>

        <div className="staff-login-footer">
          <Link to="/staff-register">Đăng ký staff</Link>
        </div>

        <div className="staff-login-footer">
          <Link to="/login">Đăng nhập khách hàng</Link>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;
