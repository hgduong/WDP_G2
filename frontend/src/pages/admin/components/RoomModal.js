import React from "react";

const ROOM_TYPES = ["Standard", "VIP", "IMAX", "Double"];

const RoomModal = ({
  show,
  editingRoom,
  formData,
  movies,
  getAvailableMovies,
  onInputChange,
  onSubmit,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingRoom ? "Sửa Phòng" : "Thêm Phòng Mới"}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label>Tên phòng *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder="VD: Phòng 1, Phòng VIP..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Loại phòng</label>
              <select
                name="type"
                value={formData.type}
                onChange={onInputChange}
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Chọn phim (tối đa 2, giữ Ctrl/Cmd để chọn nhiều)</label>
              <select
                name="movieIds"
                value={formData.movieIds}
                onChange={onInputChange}
                multiple
                style={{ height: '120px' }}
              >
                {getAvailableMovies(
                  editingRoom ? editingRoom._id : null,
                ).map((movie, index) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title} {index === 0 ? '⭐ (ưu tiên)' : ''}
                  </option>
                ))}
              </select>
              <small style={{color: '#666', fontSize: '11px'}}>
                ⭐ = phim ưu tiên chiếu trước, các phim khác phải chọn giờ cách xa tối thiểu 30 phút
              </small>
            </div>
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
              {editingRoom ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
