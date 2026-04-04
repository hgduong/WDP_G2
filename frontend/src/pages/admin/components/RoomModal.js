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
  isSaving,
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
              <label>Chọn phim (giữ Ctrl/Cmd để chọn nhiều)</label>
              <div className="movie-checkbox-list">
                {movies.map((movie) => (
                  <label key={movie._id} className="movie-checkbox-item">
                    <input
                      type="checkbox"
                      name="movieIds"
                      value={movie._id}
                      checked={(formData.movieIds || []).includes(movie._id)}
                      onChange={(e) => {
                        const values = formData.movieIds || [];
                        if (e.target.checked) {
                          onInputChange({ target: { name: 'movieIds', value: [...values, movie._id] } });
                        } else {
                          onInputChange({ target: { name: 'movieIds', value: values.filter(id => id !== movie._id) } });
                        }
                      }}
                    />
                    <span className="movie-title">{movie.title}</span>
                  </label>
                ))}
              </div>
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
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editingRoom ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
