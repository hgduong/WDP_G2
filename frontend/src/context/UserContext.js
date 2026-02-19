import { createContext, useState, useEffect } from "react";
import { getUserInfo } from "../services/api";

// Khởi tạo Context
export const UserContext = createContext();

// Provider để bọc toàn bộ app
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Khi app load lại, lấy user từ localStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserInfo(); // gọi API /profile
        // axios trả về object, bạn thường cần res.data
        setUser(res.data.user);
      } catch (err) {
        setUser(null); // nếu chưa đăng nhập hoặc token hết hạn
      }
    };

    fetchUser();
  }, []);

  // Hàm login: lưu user vào state
  const login = async () => {
    try {
      const res = await getUserInfo(); 
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:9999/logout", {
        method: "POST",
        credentials: "include", // để gửi cookie kèm request
      });
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
