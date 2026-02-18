import React, { useEffect, useState } from "react";
import "../assets/styles/Profile.css";
import { getUserInfo } from "../services/api.js";

export default function Profile() {
  const [user, setUser] = useState(null);
  // const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Lấy token từ localStorage (sau khi login)
    const token = localStorage.getItem("user");

    // Gọi API lấy thông tin user
    getUserInfo(token)
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Lỗi lấy thông tin user:", err);
      });
  }, []);

  if (!user) return <p>Đang tải thông tin...</p>;

  return (
    <div className="profile">
      <h1>Thông tin cá nhân</h1>
      <p>Email: {user.email}</p>
      <p>Họ tên: {user.fullName}</p>
      <p>Cấp độ: {user.role}</p>

    </div>
  );
}
