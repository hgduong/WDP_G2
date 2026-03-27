import { Link } from "react-router-dom";
import "../assets/styles/NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound__bg" aria-hidden="true"></div>
      <section className="notfound__content">
        <div className="notfound__badge">404! Not Found</div>
        <h1>Oops! đã có lỗi xảy ra</h1>
        <p>
          Có vẻ đường dẫn đã bị thay đổi hoặc không còn khả dụng. Vui lòng quay lại trang chủ để thử lại.
        </p>
        <div className="notfound__actions">
          <Link to="/" className="notfound__btn primary">
            Về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
