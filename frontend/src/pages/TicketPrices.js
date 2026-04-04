import "../assets/styles/TicketPrices.css";

const priceRules = [
  {
    id: 1,
    title: "U22",
    description: "Áp dụng cho khách hàng dưới 22 tuổi. Giá vé ưu đãi dành cho học sinh, sinh viên.",
    badge: "Ưu đãi",
    price: "75.000",
    unit: "VND",
    features: [
      "Dành cho khách dưới 22 tuổi",
      "Cần xuất trình thẻ học sinh/sinh viên",
      "Áp dụng tất cả các suất chiếu"
    ]
  },
  {
    id: 2,
    title: "22+ to U70",
    description: "Áp dụng cho khách hàng từ 22 tuổi đến dưới 70 tuổi. Giá vé tiêu chuẩn.",
    badge: "Tiêu chuẩn",
    price: "100.000",
    unit: "VND",
    features: [
      "Dành cho khách từ 22-69 tuổi",
      "Áp dụng tất cả các suất chiếu",
      "Không cần giấy tờ đặc biệt"
    ]
  },
  {
    id: 3,
    title: "70+",
    description: "Áp dụng cho khách hàng từ 70 tuổi trở lên. Miễn phí vé xem phim.",
    badge: "Miễn phí",
    price: "0",
    unit: "VND",
    features: [
      "Dành cho khách từ 70 tuổi trở lên",
      "Cần xuất trình CMND/CCCD",
      "Áp dụng tất cả các suất chiếu"
    ]
  }
];

export default function TicketPrices() {
  return (
    <div className="ticket-prices">
      <div className="ticket-prices__container">
        {/* Hero Section */}
        <div className="ticket-prices__hero">
          <h1 className="ticket-prices__title">Giá Vé Theo Độ Tuổi</h1>
          <p className="ticket-prices__subtitle">
            Thông tin giá vé áp dụng theo độ tuổi như yêu cầu
          </p>
        </div>

        {/* Stats Bar */}
        <div className="ticket-prices__stats">
          <div className="ticket-prices__stat">
            <div>
              <div className="ticket-prices__stat-value">3</div>
              <div className="ticket-prices__stat-label">Nhóm Tuổi</div>
            </div>
          </div>
          <div className="ticket-prices__stat">
            <div>
              <div className="ticket-prices__stat-value">50K</div>
              <div className="ticket-prices__stat-label">U22</div>
            </div>
          </div>
          <div className="ticket-prices__stat">
            <div>
              <div className="ticket-prices__stat-value">100K</div>
              <div className="ticket-prices__stat-label">22+</div>
            </div>
          </div>
        </div>

        {/* Price Grid */}
        <div className="ticket-prices__grid">
          {priceRules.map((rule) => (
            <article key={rule.id} className="price-card">
              {/* Card Header */}
              <div className="price-card__header">
                <div className="price-card__icon">
                  {rule.id}
                </div>
                <div className="price-card__badge">
                  {rule.badge}
                </div>
              </div>

              {/* Card Title */}
              <h3 className="price-card__title">{rule.title}</h3>

              {/* Card Description */}
              <p className="price-card__description">{rule.description}</p>

              {/* Card Price */}
              <div className="price-card__price">
                <span className="price-card__price-value">{rule.price}</span>
                <span className="price-card__price-unit">{rule.unit}</span>
              </div>

              {/* Card Features */}
              <div className="price-card__features">
                {rule.features.map((feature, index) => (
                  <div key={index} className="price-card__feature">
                    <span className="price-card__feature-icon">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
