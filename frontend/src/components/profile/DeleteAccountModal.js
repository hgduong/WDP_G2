import { useContext, useState } from "react";
import { deleteUserAccount } from "../../services/api";
import { UserContext } from "../../context/UserContext";

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { logout } = useContext(UserContext);
  
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await deleteUserAccount(password);
      alert("Tài khoản đã được vô hiệu hóa thành công!");
      onClose();
      logout();
      // Redirect to home or login page
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xóa tài khoản");
    } finally {
      setLoading(false);
    }
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

          {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Xóa tài khoản"}
            </button>
            <button type="button" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}