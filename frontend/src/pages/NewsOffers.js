import "../assets/styles/NewsOffers.css";

const newsItems = [
  {
    id: 1,
    title: "Lịch Chiếu Mới Nhất",
    description: "Cập nhật các suất chiếu mới nhất trong tuần với nhiều khung giờ hấp dẫn. Đặt vé ngay để không bỏ lỡ bộ phim yêu thích!",
    badge: "Mới",
    features: [
      "Suất chiếu sớm từ 8:00 AM",
      "Suất chiếu đêm đến 22:00",
      "Nhiều khung giờ linh hoạt"
    ]
  },
  {
    id: 2,
    title: "Ưu Đãi Vé Rạp",
    description: "Giảm giá vé đặc biệt cho thành viên và suất chiếu sớm. Tiết kiệm hơn khi đặt vé trực tuyến!",
    badge: "Hot",
    features: [
      "Giảm 20% cho thành viên",
      "Ưu đãi suất chiếu sớm",
      "Tích điểm đổi quà"
    ]
  },
  {
    id: 3,
    title: "Combo Nước + Bắp",
    description: "Mua combo ưu đãi tại quầy với giá tốt nhất. Thưởng thức bắp rang bơ và nước ngọt ngon tuyệt!",
    badge: "Combo",
    features: [
      "Combo tiết kiệm 30%",
      "Nhiều lựa chọn size",
      "Bắp rang bơ tươi ngon"
    ]
  },
  {
    id: 4,
    title: "Phim 3D & IMAX",
    description: "Trải nghiệm xem phim đỉnh cao với công nghệ 3D và IMAX. Hình ảnh sắc nét, âm thanh sống động!",
    badge: "Premium",
    features: [
      "Công nghệ 3D hiện đại",
      "Màn hình IMAX lớn",
      "Âm thanh Dolby Atmos"
    ]
  },
  {
    id: 5,
    title: "Đặt Vé Nhóm",
    description: "Ưu đãi đặc biệt khi đặt vé cho nhóm bạn hoặc gia đình. Vui vẻ hơn khi xem phim cùng nhau!",
    badge: "Nhóm",
    features: [
      "Giảm 15% cho nhóm 4+",
      "Đặt vé dễ dàng",
      "Chọn ghế cạnh nhau"
    ]
  },
  {
    id: 6,
    title: "Thẻ Thành Viên",
    description: "Đăng ký thẻ thành viên để nhận nhiều ưu đãi độc quyền và tích điểm đổi quà hấp dẫn!",
    badge: "VIP",
    features: [
      "Tích điểm mỗi lần xem",
      "Ưu đãi sinh nhật",
      "Quà tặng độc quyền"
    ]
  }
];

export default function NewsOffers() {
  return (
    <div className="news-offers">
      <div className="news-offers__container">
        {/* Hero Section */}
        <div className="news-offers__hero">
          <h1 className="news-offers__title">Tin Mới & Ưu Đãi</h1>
          <p className="news-offers__subtitle">
            Tổng hợp thông báo, suất chiếu mới và ưu đãi hấp dẫn đang diễn ra
          </p>
        </div>

        {/* Voucher Section */}
        <div className="news-offers__voucher">
          <div className="news-offers__voucher-content">
            <div className="news-offers__voucher-badge">Mã Giảm Giá</div>
            <h2 className="news-offers__voucher-title">CHAOMUNG</h2>
            <p className="news-offers__voucher-text">
              Sử dụng mã <strong>CHAOMUNG</strong> để nhận ưu đãi đặc biệt khi đặt vé lần đầu!
            </p>
            <div className="news-offers__voucher-discount">
              <span className="news-offers__voucher-discount-value">20%</span>
              <span className="news-offers__voucher-discount-label">Giảm giá</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="news-offers__stats">
          <div className="news-offers__stat">
            <div>
              <div className="news-offers__stat-value">6</div>
              <div className="news-offers__stat-label">Ưu Đãi</div>
            </div>
          </div>
          <div className="news-offers__stat">
            <div>
              <div className="news-offers__stat-value">20%</div>
              <div className="news-offers__stat-label">Giảm Giá</div>
            </div>
          </div>
          <div className="news-offers__stat">
            <div>
              <div className="news-offers__stat-value">30%</div>
              <div className="news-offers__stat-label">Combo</div>
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="news-offers__grid">
          {newsItems.map((item) => (
            <article key={item.id} className="news-card">
              {/* Card Header */}
              <div className="news-card__header">
                <div className="news-card__icon">
                  {item.id}
                </div>
                <div className="news-card__badge">
                  {item.badge}
                </div>
              </div>

              {/* Card Title */}
              <h3 className="news-card__title">{item.title}</h3>

              {/* Card Description */}
              <p className="news-card__description">{item.description}</p>

              {/* Card Features */}
              <div className="news-card__features">
                {item.features.map((feature, index) => (
                  <div key={index} className="news-card__feature">
                    <span className="news-card__feature-icon">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="news-offers__cta">
          <h2 className="news-offers__cta-title">Săn Ưu Đãi Ngay!</h2>
          <p className="news-offers__cta-text">
            Đừng bỏ lỡ những ưu đãi hấp dẫn nhất. Đặt vé ngay hôm nay để nhận giá tốt nhất!
          </p>
          <button className="news-offers__cta-button">
            Khám Phá Ưu Đãi
          </button>
        </div>
      </div>
    </div>
  );
}
