import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getUserBookings,
} from "../../services/api";
import "./AdminManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      setSuccess("Cập nhật trạng thái thành công");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Không thể cập nhật trạng thái");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setSuccess("Cập nhật vai trò thành công");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Không thể cập nhật vai trò");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleViewBookings = async (user) => {
    setSelectedUser(user);
    setShowBookingsModal(true);
    setBookingsLoading(true);
    try {
      // Lấy userId từ user object (userId = _id trong collection users)
      const userId = user.userId || user._id;
      const data = await getUserBookings(userId);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không thể tải lịch sử đặt vé");
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "status-badge status-active";
      case "Inactive":
        return "status-badge status-inactive";
      case "Banned":
        return "status-badge status-banned";
      case "Pending":
        return "status-badge status-pending";
      default:
        return "status-badge";
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "Admin":
        return "role-badge role-admin";
      case "Staff":
        return "role-badge role-staff";
      case "Customer":
        return "role-badge role-customer";
      default:
        return "role-badge";
    }
  };

  if (loading) {
    return (
      <div className="admin-management">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h1>Quản lý Người Dùng</h1>
        <p className="subtitle">Quản lý thông tin và tài khoản người dùng</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm("")}
            >
              ×
            </button>
          )}
        </div>
        <div className="filter-dropdowns">
          <div className="filter-dropdown">
            <label className="filter-label">Vai trò</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="Customer">Customer</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="filter-dropdown">
            <label className="filter-label">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Banned">Banned</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{user.fullName || "N/A"}</span>
                      {user.gender && (
                        <span className="user-gender">({user.gender})</span>
                      )}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || "N/A"}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      className={getRoleBadgeClass(user.role)}
                    >
                      <option value="Customer">Customer</option>
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={user.status}
                      onChange={(e) =>
                        handleStatusChange(user._id, e.target.value)
                      }
                      className={getStatusBadgeClass(user.status)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Banned">Banned</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewBookings(user)}
                        title="Xem lịch sử đặt vé"
                      >
                        Lịch sử đặt vé
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Tổng số người dùng:</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Customer:</span>
          <span className="stat-value">
            {users.filter((u) => u.role === "Customer").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Staff:</span>
          <span className="stat-value">
            {users.filter((u) => u.role === "Staff").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Admin:</span>
          <span className="stat-value">
            {users.filter((u) => u.role === "Admin").length}
          </span>
        </div>
      </div>

      {/* Bookings Modal */}
      {showBookingsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBookingsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lịch sử đặt vé - {selectedUser.fullName}</h2>
              <button
                className="modal-close"
                onClick={() => setShowBookingsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {bookingsLoading ? (
                <div className="loading">Đang tải lịch sử đặt vé...</div>
              ) : bookings.length === 0 ? (
                <div className="no-data">Người dùng chưa có lịch sử đặt vé</div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-header">
                        <span className="booking-code">
                          Mã đặt vé: {booking.bookingCode}
                        </span>
                        <span className={`booking-status status-${booking.status?.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="booking-details">
                        <div className="booking-info">
                          <strong>Phim:</strong>{" "}
                          {booking.showtimeId?.movieId?.title || "N/A"}
                        </div>
                        <div className="booking-info">
                          <strong>Rạp:</strong>{" "}
                          {booking.cinemaId?.name || "N/A"}
                        </div>
                        <div className="booking-info">
                          <strong>Phòng:</strong>{" "}
                          {booking.roomId?.name || "N/A"}
                        </div>
                        <div className="booking-info">
                          <strong>Thời gian:</strong>{" "}
                          {formatDateTime(booking.showtimeId?.startTime)}
                        </div>
                        <div className="booking-info">
                          <strong>Ghế:</strong>{" "}
                          {booking.seats?.map((s) => `${s.row}${s.number}`).join(", ") || "N/A"}
                        </div>
                        <div className="booking-info">
                          <strong>Tổng tiền:</strong>{" "}
                          {booking.totalPrice?.toLocaleString("vi-VN")} VNĐ
                        </div>
                        <div className="booking-info">
                          <strong>Trạng thái thanh toán:</strong>{" "}
                          {booking.paymentStatus}
                        </div>
                        <div className="booking-info">
                          <strong>Ngày đặt:</strong>{" "}
                          {formatDateTime(booking.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
