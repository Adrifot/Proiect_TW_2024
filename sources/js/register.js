window.onload = function() {
    var form = document.getElementById("regform");
    if(form) {
        form.onsubmit = function() {
                if(document.getElementById("pswd").value != document.getElementById("rpswd").value){
                    alert("Nu ati introdus acelasi sir pentru campurile \"parola\" si \"reintroducere parola\".");
                    return false;
                }
                return true;
            }
        }
 }