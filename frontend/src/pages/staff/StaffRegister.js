import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDistricts,
  getProvinces,
  getWards,
  registerStaffAccount,
} from "../../services/api";
import "../../assets/styles/StaffRegister.css";

const defaultFormData = {
  email: "",
  fullName: "",
  gender: "Male",
  phone: "",
  dob: "",
  idCard: "",
  address: {
    province: "",
    district: "",
    ward: "",
    street: "",
  },
  password: "",
};

function StaffRegister() {
  const [formData, setFormData] = useState(defaultFormData);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load provinces:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        province: provinceCode,
        district: "",
        ward: "",
      },
    }));
    setDistricts([]);
    setWards([]);

    if (!provinceCode) return;

    try {
      const data = await getDistricts(provinceCode);
      setDistricts(data?.districts || []);
    } catch (err) {
      console.error("Failed to load districts:", err);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        district: districtCode,
        ward: "",
      },
    }));
    setWards([]);

    if (!districtCode) return;

    try {
      const data = await getWards(districtCode);
      setWards(data?.wards || []);
    } catch (err) {
      console.error("Failed to load wards:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await registerStaffAccount(formData);
      setSuccessMessage(
        result?.message ||
          "Dang ky thanh cong. Vui long cho admin kich hoat tai khoan staff.",
      );
      setFormData(defaultFormData);
      setDistricts([]);
      setWards([]);
    } catch (err) {
      setError(err?.message || "Dang ky staff that bai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-register-page">
      <div className="staff-register-card">
        <div className="staff-register-head">
          <span className="staff-register-kicker">Staff Access</span>
          <h1>Dang ky Staff</h1>
          <p>
            Dien day du thong tin de gui yeu cau tao tai khoan staff. Tai khoan
            moi se o trang thai cho duyet cho den khi admin kich hoat.
          </p>
        </div>

        {successMessage ? (
          <div className="staff-register-alert success">{successMessage}</div>
        ) : null}
        {error ? <div className="staff-register-alert error">{error}</div> : null}

        <form onSubmit={handleSubmit} className="staff-register-form">
          <div className="staff-register-grid two">
            <label>
              Ho ten
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>

          <div className="staff-register-grid two">
            <label>
              Mat khau
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                minLength="6"
                required
              />
            </label>
            <label>
              So dien thoai
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>

          <div className="staff-register-grid two">
            <label>
              Gioi tinh
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="Male">Nam</option>
                <option value="Female">Nu</option>
                <option value="Other">Khac</option>
              </select>
            </label>
            <label>
              Ngay sinh
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <label>
            CMND/CCCD
            <input
              type="text"
              name="idCard"
              value={formData.idCard}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Tinh/Thanh pho
            <select
              name="address.province"
              value={formData.address.province}
              onChange={handleProvinceChange}
              required
            >
              <option value="">--Chon tinh/thanh pho--</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          </label>

          <div className="staff-register-grid two">
            <label>
              Quan/Huyen
              <select
                name="address.district"
                value={formData.address.district}
                onChange={handleDistrictChange}
                disabled={!formData.address.province}
                required
              >
                <option value="">--Chon quan/huyen--</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Phuong/Xa
              <select
                name="address.ward"
                value={formData.address.ward}
                onChange={handleInputChange}
                disabled={!formData.address.district}
                required
              >
                <option value="">--Chon phuong/xa--</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            So nha/Duong
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Dang gui..." : "Gui yeu cau dang ky"}
          </button>
        </form>

        <div className="staff-register-footer">
          <Link to="/staff-login">Da co tai khoan? Dang nhap staff</Link>
        </div>
      </div>
    </div>
  );
}

export default StaffRegister;
