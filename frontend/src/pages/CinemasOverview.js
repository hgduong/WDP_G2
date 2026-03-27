import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/CinemasOverview.css";
import { getAllCinemas } from "../services/api";
import sliderImage from "../assets/images/slider1.png";

export default function CinemasOverview() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadCinemas = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllCinemas();
        if (!isMounted) return;
        setCinemas(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Không thể tải danh sách rạp.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCinemas();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBookingClick = () => {
    navigate("/");
    setTimeout(() => {
      const movieSection = document.getElementById("movie-section");
      if (movieSection) {
        movieSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const features = [
    {
      icon: "M",
      title: "Màn Hình Lớn",
      desc: "Trải nghiệm hình ảnh sắc nét với công nghệ màn hình hiện đại"
    },
    {
      icon: "A",
      title: "Âm Thanh Vòm",
      desc: "Hệ thống âm thanh Dolby Atmos sống động"
    },
    {
      icon: "F",
      title: "Bắp Nước",
      desc: "Đa dạng đồ ăn nhẹ và thức uống tươi ngon"
    },
    {
      icon: "V",
      title: "Ghế VIP",
      desc: "Ghế ngồi thoải mái với không gian rộng rãi"
    }
  ];

  return (
    <div className="cinemas-overview">
      <div className="cinemas-overview__container">
        {/* Hero Section */}
        <div className="cinemas-overview__hero">
          <img 
            src={sliderImage} 
            alt="Cinema Experience" 
            className="cinemas-overview__hero-image"
          />
          <h1 className="cinemas-overview__title">Hệ Thống Rạp Chiếu Phim</h1>
          <p className="cinemas-overview__subtitle">
            Khám phá các rạp chiếu phim hiện đại với trải nghiệm xem phim tuyệt vời nhất
          </p>
        </div>

        {/* Introduction Section */}
        <div className="cinemas-overview__intro">
          <h2 className="cinemas-overview__intro-title">
            Về Hệ Thống Rạp Của Chúng Tôi
          </h2>
          <p className="cinemas-overview__intro-text">
            Hệ thống rạp chiếu phim của chúng tôi mang đến trải nghiệm giải trí đẳng cấp quốc tế với 
            công nghệ âm thanh và hình ảnh tiên tiến nhất. Mỗi rạp được thiết kế với không gian sang trọng, 
            thoải mái cùng đội ngũ nhân viên chuyên nghiệp, tận tâm. Chúng tôi cam kết mang đến cho quý khách 
            những giây phút giải trí tuyệt vời bên gia đình và bạn bè.
          </p>
          <p className="cinemas-overview__intro-text">
            Với hệ thống phòng chiếu hiện đại, ghế ngồi VIP thoải mái và dịch vụ bắp nước đa dạng, 
            chúng tôi tự hào là điểm đến lý tưởng cho mọi tín đồ điện ảnh. Hãy đến và trải nghiệm 
            sự khác biệt tại các rạp chiếu phim của chúng tôi!
          </p>

          {/* Features Grid */}
          <div className="cinemas-overview__features">
            {features.map((feature, index) => (
              <div key={index} className="cinema-feature">
                <span className="cinema-feature__icon">{feature.icon}</span>
                <h4 className="cinema-feature__title">{feature.title}</h4>
                <p className="cinema-feature__desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        {!loading && !error && (
          <div className="cinemas-overview__stats">
            <div className="cinemas-overview__stat">
              <div>
                <div className="cinemas-overview__stat-value">{cinemas.length}</div>
                <div className="cinemas-overview__stat-label">Rạp Chiếu</div>
              </div>
            </div>
            <div className="cinemas-overview__stat">
              <div>
                <div className="cinemas-overview__stat-value">
                  {cinemas.reduce((total, cinema) => 
                    total + (Array.isArray(cinema.rooms) ? cinema.rooms.length : 0), 0
                  )}
                </div>
                <div className="cinemas-overview__stat-label">Phòng Chiếu</div>
              </div>
            </div>
            <div className="cinemas-overview__stat">
              <div>
                <div className="cinemas-overview__stat-value">
                  {new Set(cinemas.map(c => c.city).filter(Boolean)).size}
                </div>
                <div className="cinemas-overview__stat-label">Thành Phố</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="cinemas-overview__loading">
            <div className="cinemas-overview__spinner"></div>
            <div className="cinemas-overview__loading-text">Đang tải dữ liệu rạp chiếu...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="cinemas-overview__error">
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && cinemas.length === 0 && (
          <div className="cinemas-overview__empty">
            <h3 className="cinemas-overview__empty-title">Chưa có rạp nào</h3>
            <p className="cinemas-overview__empty-text">
              Hệ thống rạp chiếu phim sẽ sớm được cập nhật
            </p>
          </div>
        )}

        {/* Beautiful Text Design Section */}
        {!loading && !error && cinemas.length > 0 && (
          <div className="cinemas-overview__showcase">
            <div className="cinemas-overview__showcase-content">
              <h2 className="cinemas-overview__showcase-title">
                Trải Nghiệm Điện Ảnh Đẳng Cấp
              </h2>
              <p className="cinemas-overview__showcase-text">
                Hệ thống rạp chiếu phim của chúng tôi được trang bị những công nghệ hiện đại nhất, 
                mang đến cho bạn trải nghiệm xem phim tuyệt vời nhất. Với {cinemas.length} rạp chiếu 
                trên toàn quốc, chúng tôi cam kết phục vụ quý khách hàng với chất lượng tốt nhất.
              </p>
              <div className="cinemas-overview__showcase-features">
                <div className="cinemas-overview__showcase-feature">
                  <span className="cinemas-overview__showcase-feature-number">01</span>
                  <h4>Công Nghệ Hiện Đại</h4>
                  <p>Hệ thống âm thanh và hình ảnh tiên tiến nhất thế giới</p>
                </div>
                <div className="cinemas-overview__showcase-feature">
                  <span className="cinemas-overview__showcase-feature-number">02</span>
                  <h4>Không Gian Sang Trọng</h4>
                  <p>Thiết kế nội thất đẳng cấp và thoải mái</p>
                </div>
                <div className="cinemas-overview__showcase-feature">
                  <span className="cinemas-overview__showcase-feature-number">03</span>
                  <h4>Dịch Vụ Chuyên Nghiệp</h4>
                  <p>Đội ngũ nhân viên tận tâm và chu đáo</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {!loading && !error && cinemas.length > 0 && (
          <div className="cinemas-overview__cta">
            <h2 className="cinemas-overview__cta-title">Sẵn Sàng Xem Phim?</h2>
            <p className="cinemas-overview__cta-text">
              Đặt vé ngay hôm nay để nhận ưu đãi hấp dẫn và trải nghiệm dịch vụ tốt nhất tại hệ thống rạp của chúng tôi!
            </p>
            <button 
              className="cinemas-overview__cta-button"
              onClick={handleBookingClick}
            >
              Đặt Vé Ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
