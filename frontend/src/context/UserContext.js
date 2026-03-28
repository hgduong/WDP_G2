import { createContext, useState, useEffect } from "react";
import { getUserInfo, logoutUser } from "../services/api";

// Khởi tạo Context
export const UserContext = createContext();

// Helper để lấy user từ localStorage
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getStoredRole = () => {
  try {
    return localStorage.getItem("role") || "Guest";
  } catch {
    return "Guest";
  }
};

// Provider để bọc toàn bộ app
export function UserProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [role, setRole] = useState(getStoredRole);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Khi app load lại, lấy user từ server
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserInfo();
        const userData = res.data.user;
        if (userData && userData.role) {
          setUser(userData);
          setRole(userData.role);
          // Lưu vào localStorage để persist sau khi refresh
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("role", userData.role);
        }
      } catch (err) {
        // Nếu lỗi, giữ nguyên user từ localStorage nếu có
        console.log("Không lấy được user từ server:", err.message);
      } finally {
        setIsAuthReady(true);
      }
    };

    fetchUser();
  }, []);

  // Hàm login: lưu user vào state
  const login = (userData, callback) => {
    if (userData) {
      // Use user data directly from login response
      setUser(userData);
      setRole(userData.role);
      setIsAuthReady(true);
      // Lưu vào localStorage để persist
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("role", userData.role);
      // Call callback after state is set
      if (callback) {
        setTimeout(callback, 100);
      }
    } else {
      // Fallback: fetch from server
      getUserInfo()
        .then((res) => {
          const userData = res.data.user;
          setUser(userData);
          setRole(userData.role);
          setIsAuthReady(true);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("role", userData.role);
          if (callback) {
            setTimeout(callback, 100);
          }
        })
        .catch(() => {
          setUser(null);
        });
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setRole("Guest");
      // Xóa localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, role, isAuthReady }}>
      {children}
    </UserContext.Provider>
  );
}
