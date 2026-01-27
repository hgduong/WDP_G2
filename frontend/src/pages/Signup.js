import React, { useState } from "react";
import { registerUser } from "../services/api.js";

function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
    phone: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let errorMsg = "";

    switch (name) {
      case "email":
        if (!value) {
          errorMsg = "Email là bắt buộc";
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errorMsg = "Email không hợp lệ";
          }
        }
        break;

      case "fullName":
        if (!value) {
          errorMsg = "Họ và tên là bắt buộc";
        } else if (value.length < 2) {
          errorMsg = "Tên phải có ít nhất 2 ký tự";
        } else if (value.length > 50) {
          errorMsg = "Tên không được vượt quá 50 ký tự";
        } else {
          const nameRegex = /^[\p{L}\s]+$/u;
          if (!nameRegex.test(value)) {
            errorMsg = "Tên chỉ được chứa chữ cái và khoảng trắng";
          }
        }
        break;

      case "gender":
        if (!value) {
          errorMsg = "Giới tính là bắt buộc";
        } else if (!["Male", "Female", "Other"].includes(value)) {
          errorMsg = "Giới tính không hợp lệ";
        }
        break;

      case "password":
        if (!value) {
          errorMsg = "Mật khẩu là bắt buộc";
        } else if (value.length < 6) {
          errorMsg = "Mật khẩu phải ít nhất 6 ký tự";
        }
        break;

      case "confirmPassword":
        if (value !== formData.password) {
          errorMsg = "Mật khẩu nhập lại không khớp";
        }
        break;

      case "dob":
        if (value) {
          const today = new Date();
          const dobDate = new Date(value);
          const age = today.getFullYear() - dobDate.getFullYear();
          if (age < 13) {
            errorMsg = "Bạn phải ít nhất 13 tuổi để đăng ký";
          }
        }
        break;

      case "idCard":
        if (value) {
          const idCardRegex = /^\d{9,12}$/;
          if (!idCardRegex.test(value)) {
            errorMsg = "Số CMND/CCCD phải từ 9-12 chữ số";
          }
        }
        break;

      case "phone":
        if (!value) {
          errorMsg = "Số điện thoại là bắt buộc";
        } else {
          const phoneRegex = /^(0|\+84)(\d{9})$/;
          if (!phoneRegex.test(value)) {
            errorMsg = "Số điện thoại không hợp lệ";
          }
        }
        break;

      case "address":
        if (!value) {
          errorMsg = "Địa chỉ là bắt buộc";
        } else if (value.length < 5) {
          errorMsg = "Địa chỉ phải có ít nhất 5 ký tự";
        } else if (value.length > 200) {
          errorMsg = "Địa chỉ không được vượt quá 200 ký tự";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasError = Object.values(errors).some((err) => err !== "");
    if (hasError) {
      alert("Vui lòng sửa lỗi trước khi đăng ký");
      return;
    }

    try {
      const result = await registerUser(formData);
      alert(result.message);
    } catch (err) {
      alert("Đăng ký thất bại: " + err.message);
    }
  };

  return (
    <div>
      <h2>Đăng ký tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Họ và tên</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            required
          />
        </div>
        {errors.fullName && (
          <span style={{ color: "red" }}>{errors.fullName}</span>
        )}
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email"
            required
          />
          {errors.email && <span style={{ color: "red" }}>{errors.email}</span>}
        </div>

        <div>
          <label>Mật khẩu</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 5,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
          {errors.password && (
            <span style={{ color: "red" }}>{errors.password}</span>
          )}
        </div>

        <div>
          <label>Xác nhận mật khẩu</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            required
          />
          {errors.confirmPassword && (
            <span style={{ color: "red" }}>{errors.confirmPassword}</span>
          )}
        </div>

        <div>
          <label>Giới tính</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">--Chọn giới tính--</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </select>
          {errors.gender && (
            <span style={{ color: "red" }}>{errors.gender}</span>
          )}
        </div>

        <div>
          <label>Ngày sinh</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
          {errors.dob && <span style={{ color: "red" }}>{errors.dob}</span>}
        </div>
        <div>
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            required
          />
          {errors.phone && <span style={{ color: "red" }}>{errors.phone}</span>}
        </div>

        <div>
          <label>Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Nhập địa chỉ"
            required
          />
          {errors.address && (
            <span style={{ color: "red" }}>{errors.address}</span>
          )}
        </div>
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default Signup;
