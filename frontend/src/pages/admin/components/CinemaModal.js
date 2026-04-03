import React from "react";

const CinemaModal = ({
  show,
  editingCinema,
  formData,
  onInputChange,
  onSubmit,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingCinema ? "Sửa Rạp" : "Thêm Rạp Mới"}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label>Tên rạp *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Thành phố *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={onInputChange}
              >
                <option value="Active">Hoạt động</option>
                <option value="Inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onInputChange}
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCinema ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CinemaModal;
