import React, { useState, useEffect } from "react";
import { getAllVouchers, createVoucher, updateVoucher } from "../../services/api";
import { toast } from "react-toastify";
import "../../assets/styles/AdminManagement.css";

function VoucherManagement() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 0,
    maxDiscount: 0,
    maxUsage: 1,
    maxUsagePerAccount: 1,
    minOrderValue: 0,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await getAllVouchers();
      setVouchers(res);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Chỉ convert sang số cho các trường số, giữ nguyên cho text và date
    let newValue = value;
    if (["discountPercent", "maxDiscount", "maxUsage", "maxUsagePerAccount", "minOrderValue"].includes(name)) {
      newValue = Number(value);
    }
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher._id, formData);
        toast.success("Cập nhật voucher thành công");
      } else {
        await createVoucher(formData);
        toast.success("Tạo voucher thành công");
      }
      setShowModal(false);
      setEditingVoucher(null);
      setFormData({
        code: "",
        discountPercent: 0,
        maxDiscount: 0,
        maxUsage: 1,
        maxUsagePerAccount: 1,
        minOrderValue: 0,
        startDate: "",
        endDate: "",
      });
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu voucher");
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code || "",
      discountPercent: voucher.discountPercent,
      maxDiscount: voucher.maxDiscount,
      maxUsage: voucher.maxUsage,
      maxUsagePerAccount: voucher.maxUsagePerAccount,
      minOrderValue: voucher.minOrderValue,
      startDate: voucher.startDate ? voucher.startDate.split("T")[0] : "",
      endDate: voucher.endDate ? voucher.endDate.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const getStatusBadge = (voucher) => {
    // Kiểm tra trạng thái
    if (!voucher.isActive) return <span className="badge badge-inactive">Đã vô hiệu hóa</span>;
    
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    
    if (now < startDate) return <span className="badge badge-pending">Chưa bắt đầu</span>;
    if (now > endDate) return <span className="badge badge-expired">Đã hết hạn</span>;
    if (voucher.usedCount >= voucher.maxUsage) return <span className="badge badge-expired">Đã hết lượt</span>;
    
    return <span className="badge badge-active">Hoạt động</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý Voucher/Point</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingVoucher(null);
            setFormData({
              code: "",
              discountPercent: 0,
              maxDiscount: 0,
              maxUsage: 1,
              maxUsagePerAccount: 1,
              minOrderValue: 0,
              startDate: "",
              endDate: "",
            });
            setShowModal(true);
          }}
        >
          + Thêm Voucher
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="management-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Trạng thái</th>
              <th>Giảm giá (%)</th>
              <th>Giảm tối đa</th>
              <th>Đơn tối thiểu</th>
              <th>Lượt sử dụng</th>
              <th>Mỗi user</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Code</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher, index) => (
              <tr key={voucher._id}>
                <td>{index + 1}</td>
                <td>{getStatusBadge(voucher)}</td>
                <td>{voucher.discountPercent}%</td>
                <td>{formatCurrency(voucher.maxDiscount)}</td>
                <td>{formatCurrency(voucher.minOrderValue)}</td>
                <td>
                  {voucher.usedCount}/{voucher.maxUsage}
                </td>
                <td>{voucher.maxUsagePerAccount}</td>
                <td>{formatDate(voucher.startDate)}</td>
                <td>{formatDate(voucher.endDate)}</td>
                <td>{voucher.code}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(voucher)}
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: "center" }}>
                  Chưa có voucher nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingVoucher ? "Sửa Voucher" : "Thêm Voucher"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Giảm giá (%):</label>
                <input
                  type="number"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>Giảm tối đa (VND):</label>
                <input
                  type="number"
                  name="maxDiscount"
                  value={formData.maxDiscount}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Đơn hàng tối thiểu (VND):</label>
                <input
                  type="number"
                  name="minOrderValue"
                  value={formData.minOrderValue}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Số lượt sử dụng:</label>
                <input
                  type="number"
                  name="maxUsage"
                  value={formData.maxUsage}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Số lượt/user:</label>
                <input
                  type="number"
                  name="maxUsagePerAccount"
                  value={formData.maxUsagePerAccount}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày bắt đầu:</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc:</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Code:</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="VD: NEW20, SALE50"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingVoucher ? "Cập nhật" : "Tạo mới"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoucherManagement;
