import { Link } from "react-router-dom";
import "../assets/styles/NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found">
      {/* Floating Elements */}
      <div className="not-found__floating"></div>
      <div className="not-found__floating"></div>
      <div className="not-found__floating"></div>
      <div className="not-found__floating"></div>
      <div className="not-found__floating"></div>

      <div className="not-found__container">
        {/* Hero Section */}
        <div className="not-found__hero">
          <h1 className="not-found__title">404</h1>
          <h2 className="not-found__subtitle">Trang Không Tồn Tại</h2>
          <p className="not-found__description">
            Trang bạn tìm không tồn tại hoặc đã bị di chuyển. 
            Hãy quay lại trang chủ để tiếp tục trải nghiệm điện ảnh tuyệt vời.
          </p>
        </div>

        {/* Features Section */}
        <div className="not-found__features">
          <div className="not-found__feature">
            <div className="not-found__feature-icon">
              <span className="not-found__feature-icon-text">P</span>
            </div>
            <h4 className="not-found__feature-title">Phim Đang Chiếu</h4>
            <p className="not-found__feature-desc">Khám phá các bộ phim hot nhất</p>
          </div>
          <div className="not-found__feature">
            <div className="not-found__feature-icon">
              <span className="not-found__feature-icon-text">V</span>
            </div>
            <h4 className="not-found__feature-title">Đặt Vé Nhanh</h4>
            <p className="not-found__feature-desc">Đặt vé dễ dàng và tiện lợi</p>
          </div>
          <div className="not-found__feature">
            <div className="not-found__feature-icon">
              <span className="not-found__feature-icon-text">B</span>
            </div>
            <h4 className="not-found__feature-title">Bắp Nước</h4>
            <p className="not-found__feature-desc">Thưởng thức đồ ăn nhẹ ngon</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="not-found__cta">
          <Link to="/" className="not-found__button">
            <span className="not-found__button-text">Quay lại Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
