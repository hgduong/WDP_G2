import React from "react";

const SeatPermanentDeleteConfirmModal = ({
  show,
  seat,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      onClick={isDeleting ? undefined : onCancel}
    >
      <div
        className={`modal-content modal-small ${isDeleting ? "deleting" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Xác nhận xóa vĩnh viễn ghế</h3>
          <button className="modal-close" onClick={onCancel}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa vĩnh viễn ghế{" "}
            <strong>
              {seat?.row}
              {seat?.number}
            </strong>{" "}
            không?
          </p>
          <p className="text-muted">Hành động này không thể hoàn tác.</p>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span>
                <span className="spinner"></span> Đang xóa...
              </span>
            ) : (
              "Xóa vĩnh viễn"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatPermanentDeleteConfirmModal;
