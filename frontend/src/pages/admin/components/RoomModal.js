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
              <label>Chọn phim</label>
              <select
                name="movieId"
                value={formData.movieId}
                onChange={onInputChange}
              >
                <option value="">-- Chưa có phim --</option>
                {getAvailableMovies(
                  editingRoom ? editingRoom._id : null,
                ).map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
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
