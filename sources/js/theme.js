window.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme");
    if(theme === "dark") document.body.classList.add("dark-theme");

    document.getElementById("theme-btn").addEventListener("click", () => {
        if(document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            localStorage.removeItem("theme");
        } else {
            document.body.classList.add("dark-theme");
            localStorage.setItem("theme", "dark");
        }
    });
});
