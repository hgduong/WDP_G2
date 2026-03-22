import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/all.route";
import { LanguageProvider } from "./context/LanguageContext";
import { UserProvider } from "./context/UserContext";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

function AppContent() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error && typeof error === "string") {
      toast.error(error);
      setTimeout(() => {
        window.history.replaceState({}, document.title, "/login");
      }, 10);
    }
  }, []);

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <AppContent />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;
