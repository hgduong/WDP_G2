import React from "react";

const TimeSlotsModal = ({
  show,
  editingRoom,
  timeSlotsInput,
  onTimeSlotsInputChange,
  onSave,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Quản lý khung giờ - {editingRoom?.name}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Nhập khung giờ (cách nhau bằng dấu phẩy)</label>
            <input
              type="text"
              value={timeSlotsInput}
              onChange={(e) => onTimeSlotsInputChange(e.target.value)}
              placeholder="VD: 09:00, 13:00, 17:00, 21:00"
            />
            <small className="form-hint">
              Định dạng: HH:mm (ví dụ: 09:00, 13:00, 17:00, 21:00)
            </small>
          </div>

          <div className="time-slots-preview">
            <h4>Xem trước:</h4>
            <div className="slots-list">
              {timeSlotsInput.split(",").map((s, idx) => {
                const trimmed = s.trim();
                if (!trimmed || !/^\d{1,2}:\d{2}$/.test(trimmed))
                  return null;
                return (
                  <span key={idx} className="time-slot-badge-large">
                    {trimmed}
                  </span>
                );
              })}
              {timeSlotsInput
                .split(",")
                .filter((s) => s.trim() && /^\d{1,2}:\d{2}$/.test(s.trim()))
                .length === 0 && (
                <span className="no-slots">Chưa có khung giờ hợp lệ</span>
              )}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotsModal;
