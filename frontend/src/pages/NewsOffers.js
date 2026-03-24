import "../assets/styles/SectionPages.css";

const newsItems = [
  {
    title: "Thông báo lịch chiếu mới",
    description: "Cập nhật các suất chiếu mới nhất trong tuần.",
  },
  {
    title: "Ưu đãi vé rạp",
    description: "Giảm giá vé cho thành viên và suất chiếu sớm.",
  },
  {
    title: "Combo nước + bắp",
    description: "Mua combo ưu đãi tại quầy.",
  },
];

export default function NewsOffers() {
  return (
    <div>
      <section className="section-page">
        <div className="section-page__container">
          <h1 className="section-page__title">Tin mới & ưu đãi</h1>
          <p className="section-page__subtitle">
            Tổng hợp thông báo và ưu đãi đang diễn ra.
          </p>

          <div className="section-page__grid">
            {newsItems.map((item) => (
              <article key={item.title} className="section-card">
                <h3 className="section-card__title">{item.title}</h3>
                <p className="section-card__meta">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

