export default function ProfileNav({ activeTab, setActiveTab, role }) {
  let tabs = ["info", "history", "rewards"];
  if (role === "Staff" || role === "Admin") {
    tabs = ["info"];
  }
  
  const labels = {
    info: "Thông tin tài khoản",
    history: "Lịch sử giao dịch",
    rewards: "Điểm thưởng / Ưu đãi",
  };
  return (
    <nav className="profile-nav">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          onClick={() => setActiveTab(tab)}
        >
          {labels[tab]}
        </button>
      ))}
    </nav>
  );
}

