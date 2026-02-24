import { createContext, useState, useEffect } from "react";
import { getUserInfo, logoutUser } from "../services/api";

// Khởi tạo Context
export const UserContext = createContext();

// Provider để bọc toàn bộ app
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("Guest");

  // Khi app load lại, lấy user từ server
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserInfo(); 
        setUser(res.data.user);
        setRole(res.data.user.role);
      } catch (err) {
        setUser(null); // nếu chưa đăng nhập hoặc token hết hạn
        setRole("Guest");
      }
    };

    fetchUser();
  }, []);

  // Hàm login: lưu user vào state
  const login = async () => {
    try {
      const res = await getUserInfo();
      setUser(res.data.user);
      setRole(res.data.user.role);
    } catch (err) {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setRole("Guest");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, role }}>
      {children}
    </UserContext.Provider>
  );
}
