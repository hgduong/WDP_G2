// src/App.js
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/all.route";
import { LanguageProvider } from "./context/LanguageContext";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;
