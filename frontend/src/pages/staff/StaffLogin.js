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
      setMessage(result?.message || "Ma OTP dang nhap da duoc gui qua Gmail.");
    } catch (err) {
      setError(err?.message || "Khong gui duoc OTP.");
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
        setError("Tai khoan khong thuoc nhom staff.");
        return;
      }

      login(result?.data?.user, () => {
        navigate(userRole === "Admin" ? "/admin/dashboard" : "/staff/dashboard");
      });
    } catch (err) {
      setError(err?.message || "Xac thuc OTP that bai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <h1>Staff Login</h1>
        <p>
          Staff moi dang ky can duoc admin duyet. Sau do moi lan dang nhap se
          dung email, mat khau va OTP xac nhan.
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
              <label htmlFor="staff-password">Mat khau</label>
              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhap mat khau"
                required
              />
            </>
          ) : null}

          {otpRequested ? (
            <>
              <label htmlFor="staff-otp">Ma OTP</label>
              <input
                id="staff-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhap 6 chu so"
                maxLength="6"
                required
              />
            </>
          ) : null}

          {message ? <p className="staff-login-message">{message}</p> : null}
          {error ? <p className="staff-login-error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading
              ? "Dang xu ly..."
              : otpRequested
                ? "Xac nhan OTP"
                : "Gui ma OTP"}
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
              Doi email khac
            </button>
          ) : null}
        </form>

        <div className="staff-login-footer">
          <Link to="/staff-register">Dang ky staff</Link>
        </div>

        <div className="staff-login-footer">
          <Link to="/login">Dang nhap khach hang</Link>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;
