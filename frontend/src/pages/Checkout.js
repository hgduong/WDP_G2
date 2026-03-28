// src/pages/Checkout.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../services/bookingService";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  
  const orderData = location.state;
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get showtime data - could be at different paths
      const showtimeData = orderData.showtime || {};
      
      // Prepare booking data - handle various data structures from Booking.js
      const bookingData = {
        userId: user?._id || user?.id || null,
        // showtime._id or showtime.id or direct showtimeId
        showtimeId: showtimeData._id || showtimeData.id || orderData.showtimeId,
        // Get cinemaId from room.cinemaId
        cinemaId: showtimeData.roomId?.cinemaId?._id || showtimeData.roomId?.cinemaId || showtimeData.room?.cinemaId?._id || showtimeData.room?.cinemaId,
        // showtime.roomId._id or showtime.roomId
        roomId: showtimeData.roomId?._id || showtimeData.roomId || showtimeData.room?._id || showtimeData.room,
        seats: orderData.selectedSeats || [],
        totalPrice: orderData.totalPrice,
        customerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone
        },
        paymentStatus: "Unpaid"
      };

      console.log("Sending booking data to server:", JSON.stringify(bookingData, null, 2));

      // Create booking in database with status "Pending"
      console.log("Creating booking with data:", bookingData);
      const response = await createBooking(bookingData);
      console.log("Booking response:", response);
      
      if (response.booking || response.message === "Đặt vé thành công") {
        const savedBooking = response.booking;
        
        // Navigate to Order page with booking data
        navigate("/order", {
          state: {
            orderData: savedBooking
          }
        });
      } else {
        setError(response.message || "Có lỗi xảy ra khi đặt vé: " + JSON.stringify(response));
        setLoading(false);
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Có lỗi xảy ra khi đặt vé: " + err.message);
      setLoading(false);
    }
  };

  if (!orderData || !orderData.selectedSeats) {
    return (
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded mt-10">
        <p className="text-center text-red-400">Không có thông tin đặt vé. Vui lòng chọn ghế trước.</p>
        <button 
          onClick={() => navigate("/")} 
          className="mt-4 px-4 py-2 bg-blue-600 rounded w-full"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-800 p-6 rounded mt-10">
      <h1 className="text-xl font-bold mb-4 text-white">Thanh toán vé</h1>
      
      {/* Order Summary */}
      <div className="bg-gray-700 p-4 rounded mb-4">
        <h2 className="font-semibold text-white mb-2">Thông tin đặt vé:</h2>
        <p className="text-gray-300">Phim: {orderData.showtime?.movieId?.title || "N/A"}</p>
        <p className="text-gray-300">Suất chiếu: {orderData.showtime?.roomId?.cinemaId?.name || orderData.showtime?.room?.cinemaId?.name || "N/A"} - {orderData.showtime?.roomId?.name || orderData.showtime?.room?.name || "N/A"}</p>
        <p className="text-gray-300">Ngày chiếu: {orderData.showtime?.startTime ? new Date(orderData.showtime.startTime).toLocaleString("vi-VN") : "N/A"}</p>
        <p className="text-gray-300">Ghế: {orderData.selectedSeats?.map(s => s.label).join(", ")}</p>
        <p className="text-green-400 font-bold mt-2">Tổng tiền: {orderData.totalPrice?.toLocaleString("vi-VN")}đ</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-gray-300 text-sm">Họ tên</label>
          <input 
            type="text" 
            placeholder="Họ tên"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="px-3 py-2 rounded bg-gray-700 text-white w-full border border-gray-600"
            required
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm">Email</label>
          <input 
            type="email" 
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="px-3 py-2 rounded bg-gray-700 text-white w-full border border-gray-600"
            required
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm">Số điện thoại</label>
          <input 
            type="tel" 
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="px-3 py-2 rounded bg-gray-700 text-white w-full border border-gray-600"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="mt-2 px-4 py-2 bg-green-600 rounded text-white font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Xác nhận đặt vé"}
        </button>
        
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-700"
        >
          Quay lại
        </button>
      </form>
    </div>
  );
}
