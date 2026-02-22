import React, { useEffect, useState } from "react";
import {
  getProvinces,
  getDistricts,
  getWards,
  registerUser,
} from "../services/api.js";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
      }
    };

    fetchProvinces();
  }, []);

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    setFormData({
      ...formData,
      province: provinceCode,
      district: "",
      ward: "",
    });

    try {
      const data = await getDistricts(provinceCode);
      // API trả về object có field districts
      setDistricts(data.districts || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách quận/huyện:", error);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    setFormData({ ...formData, district: districtCode, ward: "" });

    try {
      const data = await getWards(districtCode);
      // API trả về object có field wards
      setWards(data.wards || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phường/xã:", error);
    }
  };

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

        // case "password":
        if (!value) {
          errorMsg = "Mật khẩu là bắt buộc";
        } else if (value.length < 6) {
          errorMsg = "Mật khẩu phải ít nhất 6 ký tự";
        }
        break;
      case "password":
        if (!value) {
          errorMsg = "Mật khẩu là bắt buộc";
        } else {
          const trimmedValue = value.trimEnd();
          if (trimmedValue.length < 7) {
            errorMsg = "Mật khẩu phải dài hơn 6 ký tự";
          } else if (!/[A-Z]/.test(trimmedValue)) {
            errorMsg = "Mật khẩu phải có ít nhất 1 chữ in hoa";
          } else if (!/[0-9]/.test(trimmedValue)) {
            errorMsg = "Mật khẩu phải có ít nhất 1 chữ số";
          } else if (!/[^A-Za-z0-9]/.test(trimmedValue)) {
            errorMsg = "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
          }
        }
        break;

      // case "confirmPassword":
      //   if (value !== formData.password) {
      //     errorMsg = "Mật khẩu nhập lại không khớp";
      //   }
      //   break;
      case "confirmPassword":
        const trimmedConfirm = value.trimEnd();
        const trimmedPassword = formData.password.trimEnd();
        if (trimmedConfirm !== trimmedPassword) {
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
      const payload = {
        ...formData,
        address: {
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          street: formData.street,
        },
      };
      const result = await registerUser(payload);
      alert(result.data.message);
      navigate("/otp_verify", {
        state: { email: formData.email, purpose: "register" },
      });
    } catch (err) {
      alert("Đăng ký thất bại: " + err.message);
    }
  };

  return (
    <div>
      <h2>
        Đăng ký tài khoản{" "}
        <button type="button" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "🙈" : "👁"}
        </button>
      </h2>

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
          {errors.password && (
            <span style={{ color: "red" }}>{errors.password}</span>
          )}
        </div>

        <div>
          <label>Xác nhận mật khẩu</label>
          <input
            type={showPassword ? "text" : "password"}
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
          <label>Tỉnh/Thành phố</label>
          <select
            value={formData.province}
            onChange={handleProvinceChange}
            required
          >
            <option value="">--Chọn tỉnh/thành phố--</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Quận/Huyện</label>
          <select
            value={formData.district}
            onChange={handleDistrictChange}
            required
          >
            <option value="">--Chọn quận/huyện--</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Phường/Xã</label>
          <select
            value={formData.ward}
            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
            required
          >
            <option value="">--Chọn phường/xã--</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Số nhà/Đường</label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="Nhập số nhà, tên đường"
            required
          />
        </div>

        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default Signup;
