export default function ProfileNav({ activeTab, setActiveTab }) {
  const tabs = ["info", "history", "rewards"];
  const labels = {
    info: "Thông tin tài khoản",
    history: "Lịch sử giao dịch",
    rewards: "Điểm thưởng / Ưu đãi",
  };
  return (
    <nav>
      {tabs.map((tab) => (
        <button key={tab} onClick={() => setActiveTab(tab)}>
          {labels[tab]}
        </button>
      ))}{" "}
    </nav>
  );
}

