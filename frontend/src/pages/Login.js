import React, { useState, useContext } from "react";
import { loginUser } from "../services/api.js";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext.js";
import { toast } from "react-toastify";
import "../assets/styles/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, role } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginUser({ email: username, password });
      if (result.data.requireOtp) {
        toast.info(result.data.message);
        navigate(
          "/otp_verify",
          { replace: true },
          {
            state: { email: username, purpose: "register" },
          },
        );
        return;
      } else {
        // Set user and role directly from login response
        const userData = result.data.user;
        toast.success(result.data.message);

        // First set the user data and role in context
        login(userData);

        // Wait for state update then navigate
        setTimeout(() => {
          // Redirect based on user role
          if (userData.role === "Admin") {
            navigate("/admin/dashboard");
          } else if (userData.role === "Staff") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        }, 100);
      }
    } catch (err) {
      toast.error("Đăng nhập thất bại: " + err.message);
    }
  };

  const handleLoginGoogle = async (e) => {
    window.location.href = "http://localhost:9999/login-google";
  };

  const handleLoginFacebook = async (e) => {
    window.location.href = "http://localhost:9999/login/federated/facebook";
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate("/forgot_password", { replace: true });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    navigate("/signup");
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <h2 className="login-title">Đăng nhập</h2>
        {/* <p className="login-subtitle">Vui lòng đăng nhập để tiếp tục</p> */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên đăng nhập hoặc email</label>
            <div className="log-wrapper">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* {showPassword ? "👁️" : "🔒"} */}
              </button>
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <span>Hiện mật khẩu</span>
          </div>

          <button type="submit" className="login-btn">
            Đăng nhập
          </button>
        </form>

        <div className="login-links">
          <p>
            Quên mật khẩu?{" "}
            <button type="button" className="link-btn" onClick={handleForgotPassword}>
              Quên mật khẩu
            </button>
          </p>
          <p>
            Chưa có tài khoản?{" "}
            <button type="button" className="link-btn" onClick={handleSignup}>
              Đăng ký ngay
            </button>
          </p>
        </div>

        <div className="social-login">
          <p>Hoặc đăng nhập bằng:</p>
          <div className="social-buttons">
            <button className="social-btn google" onClick={handleLoginGoogle}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              className="social-btn facebook"
              onClick={handleLoginFacebook}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="#1877F2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
