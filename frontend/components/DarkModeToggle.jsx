import { useDarkMode } from "../hooks/useDarkMode";

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useDarkMode();

    return (
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 datk:text-gray-100"
        >
            {isDarkMode ? "🌞 Light" : "🌛Dark"}
        </button>
    );
};

export default DarkModeToggle;