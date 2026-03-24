import "../assets/styles/SectionPages.css";

const priceRules = [
  {
    title: "Dưới 22 tuổi",
    description: "Giá vé 50.000 VND",
    badge: "< 22",
  },
  {
    title: "Từ 22 tuổi trở lên",
    description: "Giá vé 100.000 VND",
    badge: ">= 22",
  },
  {
    title: "Trên 70 tuổi",
    description: "Miễn phí",
    badge: "> 70",
  },
];

export default function TicketPrices() {
  return (
    <div>
      <section className="section-page">
        <div className="section-page__container">
          <h1 className="section-page__title">Giá vé</h1>
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

