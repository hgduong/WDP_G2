// src/pages/Checkout.jsx
export default function Checkout() {
  return (
    <div className="max-w-md mx-auto bg-gray-800 p-6 rounded">
      <h1 className="text-xl font-bold mb-4">Thanh toán vé</h1>
      <p>Phim: Avengers</p>
      <p>Suất chiếu: CGV Hà Nội - 19:00</p>
      <p>Ghế: A1, A2</p>
      <p>Tổng tiền: 200.000đ</p>

      <form className="mt-4 flex flex-col gap-3">
        <input type="text" placeholder="Họ tên" className="px-3 py-2 rounded bg-gray-700" />
        <input type="email" placeholder="Email" className="px-3 py-2 rounded bg-gray-700" />
        <input type="tel" placeholder="Số điện thoại" className="px-3 py-2 rounded bg-gray-700" />
        <button className="mt-2 px-4 py-2 bg-green-600 rounded">Xác nhận</button>
      </form>
    </div>
  );
}
