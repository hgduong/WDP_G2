export default function TransactionHistory({ tickets }) {
  return (
    <section className="profile-section">
      <h3>Lịch sử giao dịch</h3>
      {tickets.length === 0 ? (
        <div className="transaction-empty">Chưa có giao dịch nào</div>
      ) : (
        <div className="transaction-list">
          {tickets.map((t, i) => (
            <div key={i} className="transaction-item">
              <div className="transaction-details">
                <span className="transaction-movie">{t.movie}</span>
                <span className="transaction-info">
                  {t.cinema} | Ghế {t.seat} | {t.price}đ
                </span>
              </div>
              <span className={`transaction-status ${t.status.toLowerCase()}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
