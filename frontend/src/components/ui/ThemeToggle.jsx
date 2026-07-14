import { FaMoon, FaSun } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        >
        {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
        </Button>
    </div>
  );
};

export default ThemeToggle;