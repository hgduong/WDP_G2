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
    <div className="modal">
      <h4>Xóa tài khoản</h4>
      <p>Hành động này không thể hoàn tác.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Xóa</button>
        <button type="button" onClick={onClose}>Hủy</button>
      </form>
    </div>
  );
}