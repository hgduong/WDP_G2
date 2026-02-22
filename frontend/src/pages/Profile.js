import React, { useContext, useState } from "react";
import ProfileNav from "../components/profile/ProfileNav";
import PersonalInfo from "../components/profile/PersonalInfo";
import TransactionHistory from "../components/profile/TransactionHistory";
import Rewards from "../components/profile/Rewards";
import { UserContext } from "../context/UserContext";
function Profile() {
  const [activeTab, setActiveTab] = useState("info");
  const {user} = useContext(UserContext);
  const tickets = [];


  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {" "}
      <h1>Thông tin cá nhân</h1>{" "}
      <ProfileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "info" && <PersonalInfo user={user} />}
      {activeTab === "history" && <TransactionHistory tickets={tickets} />}
      {activeTab === "rewards" && (
        <Rewards points={user.points} vouchers={["Vé 2D"]} />
      )}
    </div>
  );
}
export default Profile;
