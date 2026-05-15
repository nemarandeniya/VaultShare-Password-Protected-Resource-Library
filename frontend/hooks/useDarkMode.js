import { useState, useEffect } from "react";

export const useDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && Window.matchMedia('(prefers-color-scheme:dark)').matches)
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