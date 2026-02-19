import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/all.route";
import { LanguageProvider } from "./context/LanguageContext";
import { UserProvider } from "./context/UserContext";
import { useEffect} from "react";

function AppContent() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error && typeof error === "string") {
      alert(error);
      window.history.replaceState({}, document.title, "/login");
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

