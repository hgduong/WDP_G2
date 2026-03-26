import "../assets/styles/SectionPages.css";

const priceRules = [
  {
    title: "U22",
    description: "Áp dụng cho khách hàng dưới 22 tuổi.",
    badge: "Giá vé 50.000 VND",
  },
  {
    title: "22+ to U70",
    description: "Áp dụng cho khách hàng từ 22 tuổi đến dưới 70 tuổi.",
    badge: "Giá vé 75.000 VND",
  },
  {
    title: "70+",
    description: "Áp dụng cho khách hàng 70 tuổi đổ lên.",
    badge: "Miễn phí",
  },
];

export default function TicketPrices() {
  return (
    <div>
      <section className="section-page">
        <div className="section-page__container">
          <h1 className="section-page__title">Giá vé (Áp dụng theo độ tuổi) </h1>
          <p className="section-page__subtitle">
            Thông tin giá vé theo độ tuổi như yêu cầu.
          </p>
          <div className="section-page__grid">
            {priceRules.map((rule) => (
              <article key={rule.title} className="section-card">
                <h3 className="section-card__title">{rule.title}</h3>
                <p className="section-card__meta">{rule.description}</p>
                <span className="section-card__badge">{rule.badge}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

