import React, { useEffect, useState } from "react";
import {
  createStaff,
  getDistricts,
  getProvinces,
  getWards,
} from "../../services/api";
import "./AdminManagement.css";

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
  status: "Active",
  password: "",
};

function StaffRegistration() {
  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

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
      const createdStaff = await createStaff(formData);
      setSuccessMessage(
        `Da tao tai khoan staff thanh cong cho ${createdStaff.fullName}.`,
      );
      setFormData(defaultFormData);
      setDistricts([]);
      setWards([]);
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || "Tao staff that bai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Dang ky Staff</h2>
      </div>

      {successMessage ? <div className="alert">{successMessage}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="modal-content" style={{ maxWidth: "860px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="section-header">
            <h3>Tao tai khoan nhan vien moi</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ho ten *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mat khau *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                minLength="6"
                required
              />
            </div>
            <div className="form-group">
              <label>Trang thai</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Active">Hoat dong</option>
                <option value="Inactive">Ngung hoat dong</option>
                <option value="Pending">Cho duyet</option>
                <option value="Banned">Bi cam</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>So dien thoai *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gioi tinh</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="Male">Nam</option>
                <option value="Female">Nu</option>
                <option value="Other">Khac</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ngay sinh</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>CMND/CCCD</label>
              <input
                type="text"
                name="idCard"
                value={formData.idCard}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tinh/Thanh pho *</label>
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
          </div>

          <div className="form-group">
            <label>Quan/Huyen *</label>
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
          </div>

          <div className="form-group">
            <label>Phuong/Xa *</label>
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
          </div>

          <div className="form-group">
            <label>So nha/Duong *</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormData(defaultFormData);
                setDistricts([]);
                setWards([]);
                setError("");
                setSuccessMessage("");
              }}
            >
              Dat lai
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Dang tao..." : "Dang ky Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffRegistration;
