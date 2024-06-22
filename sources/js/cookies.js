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

function deleteCookie(name) {
    console.log(`${name}; expires=${(new Date()).toUTCString()}`);
    document.cookie = `${name}=0; expires=${(new Date()).toUTCString()}`;
}

window.addEventListener("load", function() {
    if(getCookie("banner_accepted")) {
        this.document.getElementById("cookiebanner").style.display = "none";
    }

    document.getElementById("ok_cookies").onclick = function() {
        setCookie("banner_accepted", true, 60000);
        document.getElementById("cookiebanner").style.displat = "none";
    }
});