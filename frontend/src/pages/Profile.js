import React, { useContext, useState } from "react";
import ProfileNav from "../components/profile/ProfileNav";
import PersonalInfo from "../components/profile/PersonalInfo";
import TransactionHistory from "../components/profile/TransactionHistory";
import Rewards from "../components/profile/Rewards";
import { UserContext } from "../context/UserContext";
import "../assets/styles/Profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState("info");
  const { user, role } = useContext(UserContext);

  return (
    <div className="profile-container">
      <h1>Thông tin cá nhân</h1>
      <ProfileNav activeTab={activeTab} setActiveTab={setActiveTab} role={role} />
      {activeTab === "info" && <PersonalInfo user={user} />}
      {activeTab === "history" && <TransactionHistory />}
      {activeTab === "rewards" && (
        <Rewards points={user?.points || 0} vouchers={["Vé 2D"]} />
      )}
    </div>
  );
}
export default Profile;
