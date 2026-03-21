import React, { useState, useEffect } from 'react';
import { 
  getAllStaff, 
  createStaff, 
  updateStaff, 
  // deleteStaff,
  // updateStaffStatus,
  changeStaffPassword,
  getProvinces,
  getDistricts,
  getWards
} from '../../services/api';
import './StaffManagement.css';


const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [staffFormData, setStaffFormData] = useState({
    email: '',
    fullName: '',
    gender: 'Male',
    phone: '',
    dob: '',
    idCard: '',
    address: {
      province: '',
      district: '',
      ward: '',
      street: ''
    },
    status: 'Active',
    password: ''
  });

  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    fetchStaff();
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
    }
  };

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    setStaffFormData(prev => ({ 
      ...prev, 
      address: { ...prev.address, province: provinceCode, district: '', ward: '' }
    }));
    setDistricts([]);
    setWards([]);

    try {
      const data = await getDistricts(provinceCode);
      setDistricts(data.districts || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách quận/huyện:", error);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    setStaffFormData(prev => ({ 
      ...prev, 
      address: { ...prev.address, district: districtCode, ward: '' }
    }));
    setWards([]);

    try {
      const data = await getWards(districtCode);
      setWards(data.wards || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phường/xã:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getAllStaff();
      setStaffList(data);
      setError('');
    } catch (err) {
      setError('Failed to load staff');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setStaffFormData(prev => ({ 
        ...prev, 
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setStaffFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const staffData = { ...staffFormData };
      
      if (editingStaff) {
        delete staffData.password; // Không cập nhật password khi edit
        await updateStaff(editingStaff._id, staffData);
      } else {
        await createStaff(staffData);
      }
      
      await fetchStaff();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff');
    }
  };

  // const handleDelete = async (id) => {
  //   if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa nhân viên này?')) return;
    
  //   try {
  //     await deleteStaff(id);
  //     await fetchStaff();
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Failed to delete staff');
  //   }
  // };

  // const handleStatusChange = async (id, newStatus) => {
  //   try {
  //     await updateStaffStatus(id, newStatus);
  //     await fetchStaff();
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Failed to update status');
  //   }
  // };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    try {
      await changeStaffPassword(selectedStaff._id, { 
        newPassword: passwordFormData.newPassword 
      });
      closePasswordModal();
      alert('Đổi mật khẩu thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setStaffFormData({
      email: '',
      fullName: '',
      gender: 'Male',
      phone: '',
      dob: '',
      idCard: '',
      address: {
        province: '',
        district: '',
        ward: ''
      },
      status: 'Active',
      password: ''
    });
    setDistricts([]);
    setWards([]);
    setShowModal(true);
  };

  const openEditModal = async (staff) => {
    setEditingStaff(staff);
    const staffAddress = staff.address || {};
    
    setStaffFormData({
      email: staff.email || '',
      fullName: staff.fullName || '',
      gender: staff.gender || 'Male',
      phone: staff.phone || '',
      dob: staff.dob ? staff.dob.split('T')[0] : '',
      idCard: staff.idCard || '',
      address: {
        province: staffAddress.province || '',
        district: staffAddress.district || '',
        ward: staffAddress.ward || '',
        street: staffAddress.street || ''
      },
      status: staff.status || 'Active',
      password: ''
    });

    // Load districts and wards if address exists
    if (staffAddress.province) {
      try {
        const districtsData = await getDistricts(staffAddress.province);
        setDistricts(districtsData.districts || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách quận/huyện:", error);
      }
    }

    if (staffAddress.district) {
      try {
        const wardsData = await getWards(staffAddress.district);
        setWards(wardsData.wards || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phường/xã:", error);
      }
    }

    setShowModal(true);
  };

  const openPasswordModal = (staff) => {
    setSelectedStaff(staff);
    setPasswordFormData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedStaff(null);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'badge-success',
      'Inactive': 'badge-secondary',
      'Pending': 'badge-warning',
      'Banned': 'badge-danger'
    };
    const statusLabels = {
      'Active': 'Hoạt động',
      'Inactive': 'Ngừng hoạt động',
      'Pending': 'Chờ duyệt',
      'Banned': 'Bị cấm'
    };
    return (
      <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  // Filter staff list
  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <h2>Quản lý Nhân viên</h2>
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

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="section-header">
        <h3>Danh sách Nhân viên ({filteredStaff.length})</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Thêm Nhân viên Mới
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
                <td>{staff.gender === 'Male' ? 'Nam' : staff.gender === 'Female' ? 'Nữ' : 'Khác'}</td>
                <td>{staff.dob ? new Date(staff.dob).toLocaleDateString('vi-VN') : '-'}</td>
                <td>{getStatusBadge(staff.status)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => openEditModal(staff)}
                  >
                    Sửa
                  </button>
                  {/* <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(staff._id)}
                  >
                    Xóa
                  </button> */}
                  <button 
                    className="btn btn-sm btn-change-password"
                    onClick={() => openPasswordModal(staff)}
                  >
                    Đổi MK
                  </button>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">Không có nhân viên nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStaff ? 'Sửa Thông tin Nhân viên' : 'Thêm Nhân viên Mới'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
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
                  disabled={editingStaff}
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
                  />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select name="gender" value={staffFormData.gender} onChange={handleInputChange}>
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
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tỉnh/Thành phố</label>
                <select
                  name="address.province"
                  value={staffFormData.address.province}
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

              <div className="form-group">
                <label>Quận/Huyện</label>
                <select
                  name="address.district"
                  value={staffFormData.address.district}
                  onChange={handleDistrictChange}
                  required
                  disabled={!staffFormData.address.province}
                >
                  <option value="">--Chọn quận/huyện--</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phường/Xã</label>
                <select
                  name="address.ward"
                  value={staffFormData.address.ward}
                  onChange={(e) => setStaffFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, ward: e.target.value }
                  }))}
                  required
                  disabled={!staffFormData.address.district}
                >
                  <option value="">--Chọn phường/xã--</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số nhà/Đường</label>
                <input
                  type="text"
                  name="address.street"
                  value={staffFormData.address.street}
                  onChange={handleInputChange}
                  placeholder="Nhập số nhà, tên đường"
                />
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select name="status" value={staffFormData.status} onChange={handleInputChange}>
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Banned">Bị cấm</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi mật khẩu - {selectedStaff?.fullName}</h3>
              <button className="modal-close" onClick={closePasswordModal}>&times;</button>
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
                <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>
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
    </div>
  );
};

export default StaffManagement;
