import { createContext, useState, useEffect } from "react";

// Khởi tạo Context
export const UserContext = createContext();

// Provider để bọc toàn bộ app
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Khi app load lại, lấy user từ localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Hàm login: lưu user vào state + localStorage
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Hàm logout: xóa dữ liệu
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
