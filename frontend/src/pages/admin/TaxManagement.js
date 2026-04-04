import React, { useState, useEffect } from "react";
import { getAllTaxs, createTax, updateTax, deleteTax, checkOverlap } from "../../services/taxsApi";
import { toast } from "react-toastify";
import "../../assets/styles/AdminManagement.css";

const FOOD_BEVERAGE_COMBOS = [
  { id: "combo-snoopy", name: "Combo Snoopy" },
  { id: "combo-mario-bottle", name: "Combo Mario Bottle" },
  { id: "combo-blanket", name: "Combo Blanket" },
  { id: "combo-set-mario", name: "Combo Set Mario" },
  { id: "combo-premium-cgv", name: "Combo Premium CGV" },
  { id: "combo-premium-my", name: "Combo Premium MY" },
  { id: "combo-cgv", name: "Combo CGV" },
  { id: "combo-my", name: "Combo MY" },
];

function TaxManagement() {
  const [taxs, setTaxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [overlappingTax, setOverlappingTax] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: "Movie Ticket",
    taxRate: 8,
    description: "",
    applyFrom: "",
    applyTo: "",
  });

  useEffect(() => {
    fetchTaxs();
  }, []);

  const fetchTaxs = async () => {
    try {
      setLoading(true);
      const res = await getAllTaxs();
      setTaxs(res);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách thuế");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryName = e.target.value;
    setFormData({
      ...formData,
      categoryName,
      taxRate: categoryName === "Movie Ticket" ? 8 : 10,
      applyTo: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "taxRate") {
      newValue = Number(value);
    }
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleComboSelect = (comboId) => {
    const currentApplyTo = formData.applyTo ? formData.applyTo.split(",") : [];
    let newApplyTo;
    if (currentApplyTo.includes(comboId)) {
      newApplyTo = currentApplyTo.filter((id) => id !== comboId).join(",");
    } else {
      newApplyTo = [...currentApplyTo, comboId].join(",");
    }
    setFormData({
      ...formData,
      applyTo: newApplyTo,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let applyToValue;
      if (formData.categoryName === "Movie Ticket") {
        applyToValue = formData.applyTo || null;
      } else {
        applyToValue = formData.applyTo ? formData.applyTo.split(",").filter(Boolean) : [];
      }

      const taxData = {
        ...formData,
        applyTo: applyToValue,
        lastUpdatedBy: "Admin",
      };

      if (editingTax) {
        await updateTax(editingTax._id, taxData);
        toast.success("Cập nhật thuế thành công");
      } else {
        const overlapCheck = await checkOverlap({
          categoryName: formData.categoryName,
          applyFrom: formData.applyFrom,
          applyTo: applyToValue,
        });

        if (overlapCheck.hasOverlap) {
          setOverlappingTax(overlapCheck.existingTax);
          setShowWarning(true);
          return;
        }
        await createTax(taxData);
        toast.success("Tạo thuế thành công");
      }
      setShowModal(false);
      resetForm();
      fetchTaxs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu thuế");
    }
  };

  const handleConfirmOverride = async () => {
    try {
      if (overlappingTax) {
        await updateTax(overlappingTax._id, { isActive: false });
      }
      let applyToValue;
      if (formData.categoryName === "Movie Ticket") {
        applyToValue = formData.applyTo || null;
      } else {
        applyToValue = formData.applyTo ? formData.applyTo.split(",").filter(Boolean) : [];
      }
      const taxData = {
        ...formData,
        applyTo: applyToValue,
        lastUpdatedBy: "Admin",
      };
      await createTax(taxData);
      toast.success("Tạo thuế thành công (mức cũ đã bị vô hiệu hóa)");
      setShowWarning(false);
      setOverlappingTax(null);
      setShowModal(false);
      resetForm();
      fetchTaxs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu thuế");
    }
  };

  const handleEdit = (tax) => {
    if (!tax.isActive) {
      toast.warning("Không thể sửa thuế đang bị vô hiệu");
      return;
    }
    setEditingTax(tax);
    
    let applyToValue = "";
    if (tax.categoryName === "Movie Ticket") {
      applyToValue = tax.applyTo ? tax.applyTo.split("T")[0] : "";
    } else {
      applyToValue = Array.isArray(tax.applyTo) ? tax.applyTo.join(",") : "";
    }

    setFormData({
      categoryName: tax.categoryName,
      taxRate: tax.taxRate,
      description: tax.description || "",
      applyFrom: tax.applyFrom ? tax.applyFrom.split("T")[0] : "",
      applyTo: applyToValue,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn vô hiệu hóa mức thuế này?")) {
      try {
        await deleteTax(id);
        toast.success("Vô hiệu hóa thuế thành công");
        fetchTaxs();
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi vô hiệu hóa thuế");
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn kích hoạt lại mức thuế này?")) {
      try {
        await updateTax(id, { isActive: true, lastUpdatedBy: "Admin" });
        toast.success("Kích hoạt thuế thành công");
        fetchTaxs();
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi kích hoạt thuế");
      }
    }
  };

  const resetForm = () => {
    setEditingTax(null);
    setFormData({
      categoryName: "Movie Ticket",
      taxRate: 8,
      description: "",
      applyFrom: "",
      applyTo: "",
    });
  };

  const getStatusBadge = (tax) => {
    if (!tax.isActive) return <span className="badge badge-inactive">Tạm dừng</span>;
    const now = new Date();
    const applyFrom = new Date(tax.applyFrom);
    
    if (tax.categoryName === "Movie Ticket") {
      const applyTo = tax.applyTo ? new Date(tax.applyTo) : null;
      if (now < applyFrom) return <span className="badge badge-pending">Chưa bắt đầu</span>;
      if (applyTo && now > applyTo) return <span className="badge badge-expired">Đã hết hạn</span>;
    }
    return <span className="badge badge-active">Hoạt động</span>;
  };

  const formatApplyTo = (tax) => {
    if (!tax.applyTo) return "Vô thời hạn";
    if (tax.categoryName === "Movie Ticket") {
      return new Date(tax.applyTo).toLocaleDateString("vi-VN");
    } else {
      if (Array.isArray(tax.applyTo)) {
        return tax.applyTo.map(id => {
          const combo = FOOD_BEVERAGE_COMBOS.find(c => c.id === id);
          return combo ? combo.name : id;
        }).join(", ");
      }
      return tax.applyTo;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const currentApplyToArray = formData.applyTo ? formData.applyTo.split(",").filter(Boolean) : [];

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý Thuế</h2>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Thêm mới
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="management-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Danh mục</th>
              <th>Thuế suất (%)</th>
              <th>Mô tả</th>
              <th>Ngày bắt đầu</th>
              <th>Áp dụng cho</th>
              <th>Trạng thái</th>
              <th>Cập nhật bởi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {taxs.map((tax, index) => (
              <tr key={tax._id}>
                <td>{index + 1}</td>
                <td>
                  {tax.categoryName === "Movie Ticket" ? "Vé xem phim" : "Combo Đồ ăn/Nước uống"}
                </td>
                <td>{tax.taxRate}%</td>
                <td>{tax.description || "-"}</td>
                <td>{formatDate(tax.applyFrom)}</td>
                <td>{formatApplyTo(tax)}</td>
                <td>{getStatusBadge(tax)}</td>
                <td>{tax.lastUpdatedBy || "-"}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(tax)}>
                    Sửa
                  </button>
                  {tax.isActive ? (
                    <button className="btn-delete" onClick={() => handleDelete(tax._id)}>
                      Vô hiệu
                    </button>
                  ) : (
                    <button className="btn-edit" onClick={() => handleActivate(tax._id)}>
                      Kích hoạt
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {taxs.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center" }}>
                  Chưa có mức thuế nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTax ? "Sửa Thuế" : "Thêm mới Thuế"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Danh mục:</label>
                <select
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="Movie Ticket">Vé xem phim</option>
                  <option value="Food & Beverage">Combo Đồ ăn/Nước uống</option>
                </select>
              </div>
              <div className="form-group">
                <label>Thuế suất (%):</label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày bắt đầu:</label>
                <input
                  type="date"
                  name="applyFrom"
                  value={formData.applyFrom}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {formData.categoryName === "Movie Ticket" ? (
                <div className="form-group">
                  <label>Ngày kết thúc:</label>
                  <input
                    type="date"
                    name="applyTo"
                    value={formData.applyTo}
                    onChange={handleInputChange}
                  />
                  <small style={{ color: "#666" }}>Để trống nếu áp dụng vô thời hạn</small>
                </div>
              ) : (
                <div className="form-group">
                  <label>Chọn Combo:</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
                    {FOOD_BEVERAGE_COMBOS.map((combo) => (
                      <label key={combo.id} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={currentApplyToArray.includes(combo.id)}
                          onChange={() => handleComboSelect(combo.id)}
                        />
                        {combo.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Mô tả/Ghi chú:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Lưu lý do thay đổi thuế..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingTax ? "Cập nhật" : "Thêm mới"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWarning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cảnh báo trùng lặp</h3>
            <p style={{ color: "#ff6b6b", marginBottom: "15px" }}>
              Mức thuế cũ sẽ bị vô hiệu hóa, bạn có chắc chắn?
            </p>
            <div style={{ background: "#f5f5f5", padding: "10px", marginBottom: "15px", borderRadius: "4px" }}>
              <p><strong>Danh mục:</strong> {overlappingTax?.categoryName === "Movie Ticket" ? "Vé xem phim" : "Combo Đồ ăn/Nước uống"}</p>
              <p><strong>Thuế suất:</strong> {overlappingTax?.taxRate}%</p>
              <p><strong>Áp dụng từ:</strong> {formatDate(overlappingTax?.applyFrom)}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleConfirmOverride}>
                Xác nhận
              </button>
              <button className="btn-secondary" onClick={() => setShowWarning(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaxManagement;