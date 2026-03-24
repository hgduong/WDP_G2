import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestStaffLoginOtp,
  verifyStaffLoginOtp,
} from "../../services/api";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/StaffLogin.css";

const STAFF_ROLES = ["Staff", "Admin"];

function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await requestStaffLoginOtp({ email, password });
      setOtpRequested(true);
      setMessage(result?.message || "Mã OTP đăng nhập đã được gửi qua Gmail.");
    } catch (err) {
      setError(err?.message || "Không gửi được OTP.");
    } finally {
      setLoading(false);
    }
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
        navigate(userRole === "Admin" ? "/admin/dashboard" : "/staff/dashboard");
      });
    } catch (err) {
      setError(err?.message || "Xác thực OTP thất bại.");
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
            <button
              type="button"
              onClick={() => {
                setOtpRequested(false);
                setOtp("");
                setPassword("");
                setError("");
                setMessage("");
              }}
            >
              Đổi email khác
            </button>
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
