import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { staffLogin } from "../services/api";
import { UserContext } from "../context/UserContext";
import "../assets/styles/StaffLogin.css";

const STAFF_ROLES = ["Staff", "Admin"];

function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await staffLogin({ email, password });
      if (!STAFF_ROLES.includes(result?.data?.user?.role)) {
        setError("Tai khoan khong thuoc nhom staff.");
        return;
      }

      await login();
      navigate("/");
    } catch (err) {
      setError(err?.message || "Dang nhap that bai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <h1>Staff Login</h1>
        <p>Dang nhap khu vuc nhan vien rap phim</p>

        <form onSubmit={handleSubmit} className="staff-login-form">
          <label htmlFor="staff-email">Email</label>
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@cinema.com"
            required
          />

          <label htmlFor="staff-password">Password</label>
          <input
            id="staff-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhap mat khau"
            required
          />

          <label className="staff-login-checkbox">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((prev) => !prev)}
            />
            Hien mat khau
          </label>

          {error ? <p className="staff-login-error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Dang xu ly..." : "Dang nhap Staff"}
          </button>
        </form>

        <div className="staff-login-footer">
          <Link to="/login">Dang nhap khach hang</Link>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;


