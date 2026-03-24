import { useState } from "react";

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    alert("Tài khoản đã được xóa!");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal danger-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Xóa tài khoản</h4>
        <p>Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nhập mật khẩu để xác nhận</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="actions">
            <button type="submit">Xóa tài khoản</button>
            <button type="button" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}