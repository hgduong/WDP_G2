import React, { useEffect, useState } from "react";
import {
  getProvinces,
  getDistricts,
  getWards,
  registerUser,
} from "../services/api.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../assets/styles/Signup.css";

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
    const newFormData = {
      ...formData,
      province: provinceCode,
      district: "",
      ward: "",
    };
    setFormData(newFormData);
    validateField("province", provinceCode, newFormData);

    try {
      const data = await getDistricts(provinceCode);
      setDistricts(data.districts || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách quận/huyện:", error);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    const newFormData = { ...formData, district: districtCode, ward: "" };
    setFormData(newFormData);
    validateField("district", districtCode, newFormData);

    try {
      const data = await getWards(districtCode);
      setWards(data.wards || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phường/xã:", error);
    }
  };

  const validateField = (name, value, allFormData) => {
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

      case "confirmPassword":
        if (!value) {
          errorMsg = "Vui lòng nhập lại mật khẩu";
        } else if (value !== allFormData.password) {
          errorMsg = "Mật khẩu nhập lại không khớp";
        }
        break;

      case "dob":
        if (!value) {
          errorMsg = "Ngày sinh là bắt buộc";
        } else {
          const today = new Date();
          const dobDate = new Date(value);
          const age = today.getFullYear() - dobDate.getFullYear();
          if (age < 13) {
            errorMsg = "Bạn phải ít nhất 13 tuổi để đăng ký";
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

      case "province":
        if (!value) {
          errorMsg = "Tỉnh/Thành phố là bắt buộc";
        }
        break;

      case "district":
        if (!value) {
          errorMsg = "Quận/Huyện là bắt buộc";
        }
        break;

      case "ward":
        if (!value) {
          errorMsg = "Phường/Xã là bắt buộc";
        }
        break;

      case "street":
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
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);
    validateField(name, value, newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Collect all validation errors locally
    const validationErrors = {};
    
    const validateFieldLocal = (name, value, allFormData) => {
      let errorMsg = "";
      switch (name) {
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
        case "confirmPassword":
          if (!value) {
            errorMsg = "Vui lòng nhập lại mật khẩu";
          } else if (value !== allFormData.password) {
            errorMsg = "Mật khẩu nhập lại không khớp";
          }
          break;
        case "gender":
          if (!value) {
            errorMsg = "Giới tính là bắt buộc";
          }
          break;
        case "dob":
          if (!value) {
            errorMsg = "Ngày sinh là bắt buộc";
          } else {
            const today = new Date();
            const dobDate = new Date(value);
            const age = today.getFullYear() - dobDate.getFullYear();
            if (age < 13) {
              errorMsg = "Bạn phải ít nhất 13 tuổi để đăng ký";
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
        case "province":
          if (!value) {
            errorMsg = "Tỉnh/Thành phố là bắt buộc";
          }
          break;
        case "district":
          if (!value) {
            errorMsg = "Quận/Huyện là bắt buộc";
          }
          break;
        case "ward":
          if (!value) {
            errorMsg = "Phường/Xã là bắt buộc";
          }
          break;
        case "street":
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
      if (errorMsg) {
        validationErrors[name] = errorMsg;
      }
    };

    // Validate all required fields
    validateFieldLocal("fullName", formData.fullName, formData);
    validateFieldLocal("email", formData.email, formData);
    validateFieldLocal("password", formData.password, formData);
    validateFieldLocal("confirmPassword", formData.confirmPassword, formData);
    validateFieldLocal("gender", formData.gender, formData);
    validateFieldLocal("dob", formData.dob, formData);
    validateFieldLocal("phone", formData.phone, formData);
    validateFieldLocal("province", formData.province, formData);
    validateFieldLocal("district", formData.district, formData);
    validateFieldLocal("ward", formData.ward, formData);
    validateFieldLocal("street", formData.street, formData);

    // Update errors state
    setErrors(validationErrors);

    // Check if any errors exist
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng sửa lỗi trước khi đăng ký");
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
      toast.success(result.data.message);
      navigate("/otp_verify", {
        replace: true,
        state: { email: formData.email, purpose: "register" },
      });
    } catch (err) {
      toast.error("Đăng ký thất bại: " + err.message);
    }
  };

  return (
    <div className="signup-wrapper">
      <h2 className="signup-title">
        Đăng ký tài khoản
      </h2>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
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
          <span className="error-text">{errors.fullName}</span>
        )}
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email"
            required
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
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
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
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
            <span className="error-text">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="form-group">
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
          {errors.gender && <span className="error-text">{errors.gender}</span>}
        </div>

        <div className="form-group">
          <label>Ngày sinh</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
          {errors.dob && <span className="error-text">{errors.dob}</span>}
        </div>
        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            required
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <div className="form-group">
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
          {errors.province && (
            <span className="error-text">{errors.province}</span>
          )}
        </div>

        <div className="form-group">
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
          {errors.district && (
            <span className="error-text">{errors.district}</span>
          )}
        </div>

        <div className="form-group">
          <label>Phường/Xã</label>
          <select
            value={formData.ward}
            onChange={(e) => {
              const wardValue = e.target.value;
              const newFormData = { ...formData, ward: wardValue };
              setFormData(newFormData);
              validateField("ward", wardValue, newFormData);
            }}
            required
          >
            <option value="">--Chọn phường/xã--</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.ward && <span className="error-text">{errors.ward}</span>}
        </div>

        <div className="form-group">
          <label>Số nhà/Đường</label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="Nhập số nhà, tên đường"
            required
          />
          {errors.street && (
            <span className="error-text">{errors.street}</span>
          )}
        </div>

        <button type="submit" className="signup-btn">
          Đăng ký
        </button>
      </form>
      <div className="signup-login-link">
        <p>
          Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
