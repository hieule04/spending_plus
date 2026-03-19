import { useState, useEffect } from "react";

export function useGlassTheme() {
  const [isGlass, setIsGlass] = useState(false);

  useEffect(() => {
    const check = () => setIsGlass(localStorage.getItem("app-theme") === "glass");
    check();
    window.addEventListener("theme_changed", check);
    return () => window.removeEventListener("theme_changed", check);
  }, []);

  return isGlass;
}
