export default function TransactionHistory({ tickets }) {
  return (
    <section>
      {" "}
      <h3>Lịch sử giao dịch</h3>{" "}
      {tickets.length === 0 ? (
        <p>Chưa có vé nào</p>
      ) : (
        <ul>
          {" "}
          {tickets.map((t, i) => (
            <li key={i}>
              {" "}
              {t.movie} | {t.cinema} | Ghế {t.seat} | {t.price}đ |{" "}
              {t.status}{" "}
            </li>
          ))}{" "}
        </ul>
      )}{" "}
    </section>
  );
}
