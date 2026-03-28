import { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile } from "../../services/userApi";
import AddressSelector from "./AddressSelector";
import { toast } from "react-toastify";

export default function EditProfileModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    gender: "",
    dob: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      const data = await getUserProfile();
      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
        gender: data.gender || "",
        dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
        phone: data.phone || "",
        province: data.address?.province || "",
        district: data.address?.district || "",
        ward: data.address?.ward || "",
        street: data.address?.street || "",
      });
    };

    fetchProfile();
  }, [isOpen]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateUserProfile(formData);   
    // alert("Cập nhật thành công!");
    // onClose();
    toast.success("Cập nhật thành công!");
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h4>Thay đổi thông tin</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              readOnly
              required
            />
          </div>

          <div className="form-group">
            <label>Giới tính</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">--Chọn giới tính--</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label>Ngày sinh</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <AddressSelector formData={formData} setFormData={setFormData} />

          <div className="actions">
            <button type="submit">Lưu</button>
            <button type="button" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
