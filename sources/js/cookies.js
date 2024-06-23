function setCookie(name, val, expTime) {
    d = new Date();
    d.setTime(d.getTime() + expTime);
    document.cookie = `${name}=${val}; expires=${d.toUTCString()}`;
}

function getCookie(name) {
    params = document.cookie.split(";");
    for(let param of params) {
        if(param.trim().startsWith(name+"=")) return param.split("=")[1];
    }
    return null;
}

function getAllCookies() {
    return document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
}

function deleteCookie(name) {
    console.log(`${name}; expires=${(new Date()).toUTCString()}`);
    document.cookie = `${name}=0; expires=${(new Date()).toUTCString()}`;
}

function deleteAllCookies() {
    const cookies = getAllCookies();
    cookies.forEach(cookie => deleteCookie(cookie));
}

window.addEventListener("load", function() {
    const cookiebanner = document.getElementById("cookiebanner");
    cookiebanner.style.display = "block";

    if(getCookie("banner_accepted")) {
        this.document.getElementById("cookiebanner").style.display = "none";
    }

    document.getElementById("okcookie").onclick = function() {
        setCookie("banner_accepted", true, 60000);
        document.getElementById("cookiebanner").style.display = "none";
    }
});
