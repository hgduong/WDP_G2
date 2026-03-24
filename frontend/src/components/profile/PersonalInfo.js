import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import AccountActions from "./AccountActions";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";

export default function PersonalInfo() {
  const { user, logout } = useContext(UserContext);
  const [openModal, setOpenModal] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate("/");
  };

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

      <button onClick={handleLogout} className="logout-btn">
        Đăng xuất
      </button>

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