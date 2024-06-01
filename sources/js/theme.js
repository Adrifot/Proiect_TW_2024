window.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme");
    if(theme == "dark") document.body.classList.add("dark-theme");

    document.getElementById("themecheck").addEventListener("change", () => {
        if(document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.getElementById("themecheck").checked = false;
            localStorage.removeItem("theme");
        } else {
            document.body.classList.add("dark-theme");
            document.getElementById("themecheck").checked = true;
            localStorage.setItem("theme", "dark");
        }
    });
});