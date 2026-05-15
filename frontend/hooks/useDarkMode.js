import { useState, useEffect } from "react";

export const useDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (localStorage.getItem('theme') === 'dark') {
            return true;
        }
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode, setIsDarkMode]);

    return [isDarkMode, setIsDarkMode];
}