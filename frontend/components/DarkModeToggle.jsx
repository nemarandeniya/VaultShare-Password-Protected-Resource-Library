import { useDarkMode } from "../hooks/useDarkMode";

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useDarkMode();

    return (
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
            {isDarkMode ? "🌞 Light" : "🌙 Dark"}
        </button>
    );
};

export default DarkModeToggle;