import { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile } from "../../services/api";
import AddressSelector from "./AddressSelector";

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
    alert("Cập nhật thành công!");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <h4>Thay đổi thông tin</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Họ và tên</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
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

        <div>
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

        <div>
          <label>Ngày sinh</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
        </div>

        <div>
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

        <button type="submit">Lưu</button>
        <button type="button" onClick={onClose}>
          Hủy
        </button>
      </form>
    </div>
  );
}
