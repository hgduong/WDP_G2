import { useState } from "react";
import { changePassword } from "../../services/api";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleShow = (f) => setShow({ ...show, [f]: !show[f] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const currentPassword = form.currentPassword.trim();
    const newPassword = form.newPassword.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (newPassword !== confirmPassword) {
      return setError("Mật khẩu không khớp");
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      return setError(validationError);
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Đổi mật khẩu thành công!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Có lỗi xảy ra khi đổi mật khẩu:", error);
      setError(error.response?.data?.message || "Đổi mật khẩu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = /.{7,}/; // > 6 ký tự
    const hasUppercase = /[A-Z]/;
    const hasNumber = /[0-9]/;
    const hasSpecialChar = /[^A-Za-z0-9]/;

    if (!minLength.test(password)) {
      return "Mật khẩu phải dài hơn 6 ký tự";
    }
    if (!hasUppercase.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ in hoa";
    }
    if (!hasNumber.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ số";
    }
    if (!hasSpecialChar.test(password)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    }
    return null; 
  };

  return (
    <div className="modal">
      <h4>Đổi mật khẩu</h4>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="currentPassword"
              type={show.current ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={() => toggleShow("current")}>
              {show.current ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="newPassword">Mật khẩu mới</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="newPassword"
              type={show.new ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={() => toggleShow("new")}>
              {show.new ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="confirmPassword"
              type={show.confirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={() => toggleShow("confirm")}>
              {show.confirm ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đổi"}
          </button>
          <button type="button" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
