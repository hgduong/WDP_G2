// import { useContext, useState, useEffect } from "react";
// import { UserContext } from "../../context/UserContext";
// import { getDistricts, getProvinces, getWards } from "../../services/api";
// import { getUserProfile,updateUserProfile } from "../../services/api";

// export default function PersonalInfo() {
//   const { user } = useContext(UserContext);
//   const [openModal, setOpenModal] = useState(null);

//   const [provinces, setProvinces] = useState([]);
//   const [districts, setDistricts] = useState([]);
//   const [wards, setWards] = useState([]);

//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     gender: "",
//     dob: "",
//     phone: "",
//     province: "",
//     district: "",
//     ward: "",
//     street: "",
//   });

//   useEffect(() => {
//     const fetchProvinces = async () => {
//       try {
//         const data = await getProvinces();
//         setProvinces(data);
//       } catch (error) {
//         console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
//       }
//     };

//     fetchProvinces();
//   }, []);

//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       try {
//         const data = await getUserProfile();
//         setFormData({
//           fullName: data.fullName || "",
//           email: data.email || "",
//           gender: data.gender || "",
//           dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
//           phone: data.phone || "",
//           province: data.address?.province || "",
//           district: data.address?.district || "",
//           ward: data.address?.ward || "",
//           street: data.address?.street || "",
//         });

//         // load districts theo province
//         if (data.address?.province) {
//           const districtsData = await getDistricts(data.address.province);
//           setDistricts(districtsData.districts || []);
//         }

//         // load wards theo district
//         if (data.address?.district) {
//           const wardsData = await getWards(data.address.district);
//           setWards(wardsData.wards || []);
//         }
//       } catch (error) {
//         console.error("Không thể tải thông tin chi tiết:", error);
//       }
//     };
//     if (user) fetchUserProfile();
//   }, [user]);

//   const handleProvinceChange = async (e) => {
//     const provinceCode = e.target.value;
//     setFormData({
//       ...formData,
//       province: provinceCode,
//       district: "",
//       ward: "",
//     });

//     try {
//       const data = await getDistricts(provinceCode);
//       // API trả về object có field districts
//       setDistricts(data.districts || []);
//     } catch (error) {
//       console.error("Lỗi khi lấy danh sách quận/huyện:", error);
//     }
//   };

//   const handleDistrictChange = async (e) => {
//     const districtCode = e.target.value;
//     setFormData({ ...formData, district: districtCode, ward: "" });

//     try {
//       const data = await getWards(districtCode);
//       // API trả về object có field wards
//       setWards(data.wards || []);
//     } catch (error) {
//       console.error("Lỗi khi lấy danh sách phường/xã:", error);
//     }
//   };
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await updateUserProfile(formData);
//       console.log("Thông tin đã được cập nhật:", res);
//       alert("Thông tin đã được cập nhật!");
//       setOpenModal(null);
//     } catch (error) {
//       console.error("Có lỗi xảy ra khi cập nhật:", error);
//       alert("Có lỗi xảy ra khi cập nhật!");
//     }
//   };

//   if (!user) return <p>Vui lòng đăng nhập để xem thông tin cá nhân</p>;

//   return (
//     <section>
//       <h3>Thông tin cá nhân</h3>

//       <div className="account-actions">
//         <button onClick={() => setOpenModal("info")}>
//           Thay đổi thông tin thành viên
//         </button>
//         <button onClick={() => setOpenModal("password")}>
//           Thay đổi mật khẩu
//         </button>
//         <button onClick={() => setOpenModal("delete")}>Ly khai</button>
//       </div>

//       {/* Modal Thay đổi thông tin */}
//       {openModal === "info" && (
//         <div className="modal">
//           <h4>Thay đổi thông tin thành viên</h4>
//           <form onSubmit={handleSubmit}>
//             <div>
//               <label>Họ và tên</label>
//               <input
//                 type="text"
//                 name="fullName"
//                 value={formData.fullName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div>
//               <label>Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div>
//               <label>Giới tính</label>
//               <select
//                 name="gender"
//                 value={formData.gender}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">--Chọn giới tính--</option>
//                 <option value="Male">Nam</option>
//                 <option value="Female">Nữ</option>
//                 <option value="Other">Khác</option>
//               </select>
//             </div>

//             <div>
//               <label>Ngày sinh</label>
//               <input
//                 type="date"
//                 name="dob"
//                 value={formData.dob}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div>
//               <label>Số điện thoại</label>
//               <input
//                 type="text"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div>
//               <label>Tỉnh/Thành phố</label>
//               <select
//                 value={formData.province}
//                 onChange={handleProvinceChange}
//                 required
//               >
//                 <option value="">--Chọn tỉnh/thành phố--</option>
//                 {provinces.map((p) => (
//                   <option key={p.code} value={p.code}>
//                     {p.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label>Quận/Huyện</label>
//               <select
//                 value={formData.district}
//                 onChange={handleDistrictChange}
//                 required
//               >
//                 <option value="">--Chọn quận/huyện--</option>
//                 {districts.map((d) => (
//                   <option key={d.code} value={d.code}>
//                     {d.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label>Phường/Xã</label>
//               <select
//                 value={formData.ward}
//                 onChange={(e) =>
//                   setFormData({ ...formData, ward: e.target.value })
//                 }
//                 required
//               >
//                 <option value="">--Chọn phường/xã--</option>
//                 {wards.map((w) => (
//                   <option key={w.code} value={w.code}>
//                     {w.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label>Số nhà/Đường</label>
//               <input
//                 type="text"
//                 name="street"
//                 value={formData.street}
//                 onChange={handleChange}
//                 placeholder="Nhập số nhà, tên đường"
//                 required
//               />
//             </div>

//             <button type="submit">Thay đổi</button>
//             <button type="button" onClick={() => setOpenModal(null)}>
//               Hủy
//             </button>
//           </form>
//         </div>
//       )}
//     </section>
//   );
// }


import { useState, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import AccountActions from "./AccountActions";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";

export default function PersonalInfo() {
  const { user } = useContext(UserContext);
  const [openModal, setOpenModal] = useState(null);

  if (!user)
    return (
      <div className="profile-section">
        <div className="login-prompt">
          Vui lòng{" "}
          <a href="/login">đăng nhập</a> để xem thông tin cá nhân
        </div>
      </div>
    );

  return (
    <section className="profile-section">
      <h3>Thông tin cá nhân</h3>

      <AccountActions onOpen={setOpenModal} />

      <EditProfileModal
        isOpen={openModal === "info"}
        onClose={() => setOpenModal(null)}
      />

      <ChangePasswordModal
        isOpen={openModal === "password"}
        onClose={() => setOpenModal(null)}
      />

      <DeleteAccountModal
        isOpen={openModal === "delete"}
        onClose={() => setOpenModal(null)}
      />
    </section>
  );
}