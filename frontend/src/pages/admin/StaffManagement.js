import React, { useEffect, useState } from "react";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  changeStaffPassword,
  getProvinces,
  getDistricts,
  getWards,
} from "../../services/api";
import "./AdminManagement.css";
import "./StaffManagement.css";

const defaultStaffFormData = {
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

const defaultPasswordFormData = {
  newPassword: "",
  confirmPassword: "",
};

const getApiErrorMessage = (error, fallback) =>
  error?.message || error?.response?.data?.message || fallback;

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [staffFormData, setStaffFormData] = useState(defaultStaffFormData);
  const [passwordFormData, setPasswordFormData] = useState(
    defaultPasswordFormData,
  );
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    fetchStaff();
    fetchProvinces();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getAllStaff();
      setStaffList(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load staff"));
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load provinces:", err);
    }
  };

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;

    setStaffFormData((prev) => ({
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

    setStaffFormData((prev) => ({
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setStaffFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
      return;
    }

    setStaffFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setStaffFormData(defaultStaffFormData);
    setDistricts([]);
    setWards([]);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedStaff(null);
    setPasswordFormData(defaultPasswordFormData);
  };

  const openAddModal = () => {
    setError("");
    setEditingStaff(null);
    setStaffFormData(defaultStaffFormData);
    setDistricts([]);
    setWards([]);
    setShowModal(true);
  };

  const openEditModal = async (staff) => {
    const staffAddress = staff.address || {};

    setError("");
    setEditingStaff(staff);
    setStaffFormData({
      email: staff.email || "",
      fullName: staff.fullName || "",
      gender: staff.gender || "Male",
      phone: staff.phone || "",
      dob: staff.dob ? staff.dob.split("T")[0] : "",
      idCard: staff.idCard || "",
      address: {
        province: staffAddress.province || "",
        district: staffAddress.district || "",
        ward: staffAddress.ward || "",
        street: staffAddress.street || "",
      },
      status: staff.status || "Active",
      password: "",
    });

    try {
      if (staffAddress.province) {
        const districtsData = await getDistricts(staffAddress.province);
        setDistricts(districtsData?.districts || []);
      } else {
        setDistricts([]);
      }

      if (staffAddress.district) {
        const wardsData = await getWards(staffAddress.district);
        setWards(wardsData?.wards || []);
      } else {
        setWards([]);
      }
    } catch (err) {
      console.error("Failed to preload address options:", err);
    }

    setShowModal(true);
  };

  const openPasswordModal = (staff) => {
    setError("");
    setSelectedStaff(staff);
    setPasswordFormData(defaultPasswordFormData);
    setShowPasswordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const staffData = { ...staffFormData };

      if (editingStaff) {
        delete staffData.password;
        await updateStaff(editingStaff._id, staffData);
      } else {
        await createStaff(staffData);
      }

      await fetchStaff();
      closeModal();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save staff"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ban co chac muon vo hieu hoa nhan vien nay?")) {
      return;
    }

    try {
      await deleteStaff(id);
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to disable staff"));
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    try {
      await updateStaffStatus(id, newStatus);
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update status"));
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateStaffStatus(id, "Active");
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to approve staff"));
    }
  };

  const handleReject = async (id) => {
    try {
      await updateStaffStatus(id, "Inactive");
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reject staff"));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError("Mat khau moi khong khop");
      return;
    }

    try {
      await changeStaffPassword(selectedStaff._id, {
        newPassword: passwordFormData.newPassword,
      });
      closePasswordModal();
      window.alert("Doi mat khau thanh cong");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to change password"));
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Active: "badge-success",
      Inactive: "badge-secondary",
      Pending: "badge-warning",
      Banned: "badge-danger",
    };

    const statusLabels = {
      Active: "Hoat dong",
      Inactive: "Ngung hoat dong",
      Pending: "Cho duyet",
      Banned: "Bi cam",
    };

    return (
      <span className={`badge ${statusClasses[status] || "badge-secondary"}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const filteredStaff = staffList.filter((staff) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      staff.fullName?.toLowerCase().includes(normalizedSearch) ||
      staff.email?.toLowerCase().includes(normalizedSearch) ||
      staff.phone?.includes(searchTerm);
    const matchesStatus = statusFilter ? staff.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quan ly Nhan vien</h2>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Tim kiem:</label>
          <input
            type="text"
            placeholder="Ten, email, so dien thoai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Trang thai:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tat ca</option>
            <option value="Active">Hoat dong</option>
            <option value="Inactive">Ngung hoat dong</option>
            <option value="Pending">Cho duyet</option>
            <option value="Banned">Bi cam</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-header">
        <h3>Danh sach Nhan vien ({filteredStaff.length})</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Them Nhan vien Moi
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ho ten</th>
              <th>Email</th>
              <th>So dien thoai</th>
              <th>Gioi tinh</th>
              <th>Ngay sinh</th>
              <th>Trang thai</th>
              <th>Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff, index) => (
              <tr key={staff._id}>
                <td>{index + 1}</td>
                <td>{staff.fullName}</td>
                <td>{staff.email}</td>
                <td>{staff.phone}</td>
                <td>
                  {staff.gender === "Male"
                    ? "Nam"
                    : staff.gender === "Female"
                      ? "Nu"
                      : "Khac"}
                </td>
                <td>
                  {staff.dob
                    ? new Date(staff.dob).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td>{getStatusBadge(staff.status)}</td>
                <td>
                  {staff.status === "Pending" ? (
                    <>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleApprove(staff._id)}
                      >
                        Duyet
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleReject(staff._id)}
                      >
                        Tu choi
                      </button>
                    </>
                  ) : null}
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => openEditModal(staff)}
                  >
                    Sua
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(staff._id)}
                  >
                    Vo hieu hoa
                  </button>
                  <button
                    className="btn btn-sm btn-change-password"
                    onClick={() => openPasswordModal(staff)}
                  >
                    Doi MK
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleStatusChange(staff._id, staff.status)}
                  >
                    {staff.status === "Active" ? "Tat" : "Bat"}
                  </button>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">
                  Khong co nhan vien nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingStaff
                  ? "Sua Thong tin Nhan vien"
                  : "Them Nhan vien Moi"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Ho ten *</label>
                <input
                  type="text"
                  name="fullName"
                  value={staffFormData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={staffFormData.email}
                  onChange={handleInputChange}
                  required
                  disabled={Boolean(editingStaff)}
                />
              </div>

              {!editingStaff && (
                <div className="form-group">
                  <label>Mat khau *</label>
                  <input
                    type="password"
                    name="password"
                    value={staffFormData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>So dien thoai *</label>
                  <input
                    type="text"
                    name="phone"
                    value={staffFormData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gioi tinh</label>
                  <select
                    name="gender"
                    value={staffFormData.gender}
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
                    value={staffFormData.dob}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>CMND/CCCD</label>
                  <input
                    type="text"
                    name="idCard"
                    value={staffFormData.idCard}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tinh/Thanh pho *</label>
                <select
                  name="address.province"
                  value={staffFormData.address.province}
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
                  value={staffFormData.address.district}
                  onChange={handleDistrictChange}
                  required
                  disabled={!staffFormData.address.province}
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
                  value={staffFormData.address.ward}
                  onChange={handleInputChange}
                  required
                  disabled={!staffFormData.address.district}
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
                  value={staffFormData.address.street}
                  onChange={handleInputChange}
                  placeholder="Nhap so nha, ten duong"
                  required
                  minLength="2"
                />
              </div>

              <div className="form-group">
                <label>Trang thai</label>
                <select
                  name="status"
                  value={staffFormData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Hoat dong</option>
                  <option value="Inactive">Ngung hoat dong</option>
                  <option value="Pending">Cho duyet</option>
                  <option value="Banned">Bi cam</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Huy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? "Cap nhat" : "Them moi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div
            className="modal-content password-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Doi mat khau - {selectedStaff?.fullName}</h3>
              <button className="modal-close" onClick={closePasswordModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label>Mat khau moi *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Nhap lai mat khau *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  minLength="6"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closePasswordModal}
                >
                  Huy
                </button>
                <button type="submit" className="btn btn-primary">
                  Doi mat khau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
