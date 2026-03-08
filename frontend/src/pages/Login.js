import React, { useState, useContext } from "react";
import { loginUser } from "../services/api.js";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext.js";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginUser({ email: username, password });
      if (result.data.requireOtp) {
        alert(result.data.message);
        navigate("/otp_verify", {
          state: { email: username, purpose: "register" },
        });
        return;
      } else {
        // Set user and role directly from login response
        const userData = result.data.user;
        login(userData);
        alert(result.data.message);
        // Redirect based on user role
        if (userData.role === "Admin") {
          navigate("/admin/dashboard");
        } else if (userData.role === "Staff") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      alert("Đăng ký thất bại: " + err.message);
    }
  };

  const handleLoginGoogle = async(e) => {
      window.location.href = "http://localhost:9999/login-google";
  };


  const handleLoginFacebook = async(e) => {
      window.location.href = "http://localhost:9999/login/federated/facebook";
  };
  return (
    <div>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
          />
        </div>

        <div>
          <label>Mật khẩu</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
          />
        </div>

        <div>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          <span>Hiện mật khẩu</span>
        </div>

        <button type="submit">Đăng nhập</button>
      </form>

      <p>
        Quên mật khẩu? <a href="/forgot_password">Quên mật khẩu</a>
      </p>
      <p>
        Chưa có tài khoản? <a href="/signup">Đăng ký ngay</a>
      </p>

      <div>
        <p>Hoặc đăng nhập bằng:</p>
        <button onClick={handleLoginGoogle}>Sign in with Google</button>
        <button onClick={handleLoginFacebook}>Sign in with Facebook</button> 
      </div>
    </div>
  );
}

export default Login;
