// src/App.js
// import "./App.css";
// import { RouterProvider } from "react-router-dom";
// import { router } from "./routes/all.route";
// import { LanguageProvider } from "./context/LanguageContext";
// import { UserProvider } from "./context/UserContext";

// function App() {
//   return (
//     <UserProvider>
//       <LanguageProvider>
//         <RouterProvider router={router} />
//       </LanguageProvider>
//     </UserProvider>
//   );
// }

// export default App;

import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/all.route";
import { LanguageProvider } from "./context/LanguageContext";
import { UserProvider, UserContext } from "./context/UserContext";
import { useEffect, useContext } from "react";

function AppContent() {
  const { login } = useContext(UserContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error && typeof error === "string") {
      alert(error);
      window.history.replaceState({}, document.title, "/login");
    }

    if (token) {
      // decode JWT hoặc gọi API /me để lấy user info
      const user = parseJwt(token);
      login(user, token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // Xóa query string khỏi URL để gọn gàng
      window.location.replace("/");
    }
  }, []);

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;

// Hàm decode JWT đơn giản
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
}
