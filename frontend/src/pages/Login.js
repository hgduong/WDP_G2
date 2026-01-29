import React, { useState } from "react";
import { loginUser } from "../services/api.js";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginUser({ email: username, password });
      console.log("Token nhận được:", result.data.token);
      alert(result.data.message);
    } catch (err) {
      alert("Đăng ký thất bại: " + err.message);
    }
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
        Quên mật khẩu? <a href="/forgot-password">Quên mật khẩu</a>
      </p>
      <p>
        Chưa có tài khoản? <a href="/signup">Đăng ký ngay</a>
      </p>

      {/* <div>
        <p>Hoặc đăng nhập bằng:</p>
        <button>Google</button>
        <button>Facebook</button>
      </div> */}
    </div>
  );
}

export default Login;
