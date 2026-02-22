export default function Rewards({ points, vouchers }) {
  return (
    <section>
      {" "}
      <h3>Điểm thưởng / Ưu đãi</h3> <p>Điểm hiện tại: {points}</p>{" "}
      <p>Voucher: {vouchers.join(", ") || "Không có"}</p>{" "}
      <button>Đổi điểm</button>{" "}
    </section>
  );
}
