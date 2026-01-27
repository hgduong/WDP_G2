// src/context/LanguageContext.jsx
import { createContext, useState } from "react";

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("vi"); // mặc định tiếng Việt

  const toggleLang = () => {
    setLang(lang === "vi" ? "en" : "vi");
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
