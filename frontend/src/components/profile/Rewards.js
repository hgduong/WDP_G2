export default function Rewards({ points, vouchers }) {
  return (
    <section className="profile-section">
      <h3>Điểm thưởng / Ưu đãi</h3>
      <div className="rewards-section">
        <div className="rewards-points">
          <div className="rewards-points-icon">⭐</div>
          <div className="rewards-points-info">
            <h4>Điểm tích lũy</h4>
            <div className="rewards-points-value">{points} điểm</div>
          </div>
        </div>

        <div className="rewards-vouchers">
          <h4>Voucher của bạn</h4>
          {vouchers && vouchers.length > 0 ? (
            <div className="voucher-list">
              {vouchers.map((voucher, index) => (
                <div key={index} className="voucher-item">
                  <span className="voucher-name">{voucher}</span>
                  <span className="voucher-points">100 điểm</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Bạn chưa có voucher nào
            </p>
          )}
        </div>

        <button className="redeem-btn">Đổi điểm thưởng</button>
      </div>
    </section>
  );
}
