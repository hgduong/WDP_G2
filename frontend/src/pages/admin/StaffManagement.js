import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
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
  const [success, setSuccess] = useState("");
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const confirmActionRef = useRef(null);
  const lastPasswordByStaffRef = useRef({});

  useEffect(() => {
    fetchStaff();
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError("");
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      setSuccess("");
    }
  }, [success]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getAllStaff();
      setStaffList(Array.isArray(data) ? data : []);
      setError("");
      setSuccess("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải danh sách staff"));
      setSuccess("");
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

    if (name === "phone") {
      const digitsOnly = String(value).replace(/\D/g, "").slice(0, 11);
      setStaffFormData((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }

    if (name === "idCard") {
      const digitsOnly = String(value).replace(/\D/g, "").slice(0, 12);
      setStaffFormData((prev) => ({ ...prev, idCard: digitsOnly }));
      return;
    }

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
    setSuccess("");
    setEditingStaff(null);
    setStaffFormData(defaultStaffFormData);
    setDistricts([]);
    setWards([]);
    setShowModal(true);
  };

  const openEditModal = async (staff) => {
    const staffAddress = staff.address || {};

    setError("");
    setSuccess("");
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
    setSuccess("");
    setSelectedStaff(staff);
    setPasswordFormData(defaultPasswordFormData);
    setShowPasswordModal(true);
  };

  const openConfirm = (message, action) => {
    setConfirmMessage(message);
    confirmActionRef.current = action;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (confirmActionRef.current) {
      confirmActionRef.current();
    }
    confirmActionRef.current = null;
    setConfirmOpen(false);
  };

  const handleCancelConfirm = () => {
    confirmActionRef.current = null;
    setConfirmOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const staffData = { ...staffFormData };

      if (editingStaff) {
        delete staffData.password;
        await updateStaff(editingStaff._id, staffData);
        setSuccess("Cập nhật nhân viên thành công");
      } else {
        await createStaff(staffData);
        setSuccess("Thêm nhân viên thành công");
      }

      setError("");
      await fetchStaff();
      closeModal();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể lưu staff"));
      setSuccess("");
    }
  };

  const handleDelete = (id) => {
    openConfirm("Bạn có chắc muốn vô hiệu hóa nhân viên này?", async () => {
      try {
        await deleteStaff(id);
        await fetchStaff();
      } catch (err) {
        setError(getApiErrorMessage(err, "Không thể vô hiệu hóa staff"));
      }
    });
  };

  const handleActivate = async (id) => {
    try {
      await updateStaffStatus(id, { status: "Active" });
      setSuccess("Cập nhật trạng thái thành công");
      setError("");
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể cập nhật trạng thái"));
      setSuccess("");
    }
  };

  const handleBan = async (id) => {
    try {
      await updateStaffStatus(id, { status: "Banned" });
      setSuccess("Đã chuyển nhân viên sang trạng thái bị cấm");
      setError("");
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể cập nhật trạng thái"));
      setSuccess("");
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateStaffStatus(id, { status: "Active" });
      setSuccess("Duyệt nhân viên thành công");
      setError("");
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể duyệt staff"));
      setSuccess("");
    }
  };

  const handleReject = async (id) => {
    try {
      await updateStaffStatus(id, { status: "Inactive" });
      setSuccess("Từ chối nhân viên thành công");
      setError("");
      await fetchStaff();
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể từ chối staff"));
      setSuccess("");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }

    const staffId = selectedStaff?._id;
    if (
      staffId &&
      lastPasswordByStaffRef.current[staffId] === passwordFormData.newPassword
    ) {
      setError("Mật khẩu mới không được trùng với mật khẩu gần nhất");
      return;
    }

    try {
      await changeStaffPassword(selectedStaff._id, {
        newPassword: passwordFormData.newPassword,
      });
      if (staffId) {
        lastPasswordByStaffRef.current[staffId] = passwordFormData.newPassword;
      }
      closePasswordModal();
      setSuccess("Đổi mật khẩu thành công");
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể đổi mật khẩu"));
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
      Active: "Hoạt động",
      Inactive: "Ngừng hoạt động",
      Pending: "Chờ duyệt",
      Banned: "Bị cấm",
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
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý nhân viên</h2>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Ngừng hoạt động</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Banned">Bị cấm</option>
          </select>
        </div>
      </div>


      <div className="section-header">
        <h3>Danh sách nhân viên ({filteredStaff.length})</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Thêm nhân viên mới
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Giới tính</th>
              <th>Ngày sinh</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
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
                      ? "Nữ"
                      : "Khác"}
                </td>
                <td>
                  {staff.dob
                    ? new Date(staff.dob).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td>{getStatusBadge(staff.status)}</td>
                <td>
                  <div className="staff-actions">
                    {staff.status === "Pending" ? (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleApprove(staff._id)}
                        >
                          Duyệt
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleReject(staff._id)}
                        >
                          Từ chối
                        </button>
                      </>
                    ) : null}
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => openEditModal(staff)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-change-password"
                      onClick={() => openPasswordModal(staff)}
                    >
                      Đổi MK
                    </button>
                    {staff.status === "Active" && (
                      <>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(staff._id)}
                        >
                          Vô hiệu hóa
                        </button>
                        <button
                          className="btn btn-sm btn-ban"
                          onClick={() =>
                            openConfirm(
                              "Bạn có chắc muốn chuyển nhân viên này sang trạng thái bị cấm?",
                              () => handleBan(staff._id),
                            )
                          }
                        >
                          Bị cấm
                        </button>
                      </>
                    )}
                    {(staff.status === "Inactive" || staff.status === "Banned") && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleActivate(staff._id)}
                      >
                        Mở lại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">
                  Không có nhân viên nào
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
                  ? "Sửa thông tin nhân viên"
                  : "Thêm nhân viên mới"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Họ tên *</label>
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
                  <label>Mật khẩu *</label>
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
                  <label>Số điện thoại *</label>
                  <input
                    type="text"
                    name="phone"
                    value={staffFormData.phone}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={11}
                  />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    name="gender"
                    value={staffFormData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày sinh</label>
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tỉnh/Thành phố *</label>
                <select
                  name="address.province"
                  value={staffFormData.address.province}
                  onChange={handleProvinceChange}
                  required
                >
                  <option value="">--Chọn tỉnh/thành phố--</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quận/Huyện *</label>
                <select
                  name="address.district"
                  value={staffFormData.address.district}
                  onChange={handleDistrictChange}
                  required
                  disabled={!staffFormData.address.province}
                >
                  <option value="">--Chọn quận/huyện--</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phường/Xã *</label>
                <select
                  name="address.ward"
                  value={staffFormData.address.ward}
                  onChange={handleInputChange}
                  required
                  disabled={!staffFormData.address.district}
                >
                  <option value="">--Chọn phường/xã--</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số nhà/Đường *</label>
                <input
                  type="text"
                  name="address.street"
                  value={staffFormData.address.street}
                  onChange={handleInputChange}
                  placeholder="Nhập số nhà, tên đường"
                  required
                  minLength="2"
                />
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  name="status"
                  value={staffFormData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Banned">Bị cấm</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? "Cập nhật" : "Thêm mới"}
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
              <h3>Đổi mật khẩu - {selectedStaff?.fullName}</h3>
              <button className="modal-close" onClick={closePasswordModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label>Mật khẩu mới *</label>
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
                <label>Nhập lại mật khẩu *</label>
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
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-overlay" onClick={handleCancelConfirm}>
          <div
            className="modal-content modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Xác nhận</h3>
              <button className="modal-close" onClick={handleCancelConfirm}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>{confirmMessage}</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelConfirm}
              >
                Hủy
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirm}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;










