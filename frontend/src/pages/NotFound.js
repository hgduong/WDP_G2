import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Trang bạn tìm không tồn tại.</p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
      >
        Quay lại Trang Chủ
      </Link>
    </div>
  );
}
