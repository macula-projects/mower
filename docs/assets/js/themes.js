/*Note: if you want to draw charts and sparkline with Theme Colors you must place skins.js in your page before beyond.js*/
/*Do not use JQuery if you intend to use this file in Head element*/


//Handle Skins
if (readCookie("current-skin")) {
    var a = document.createElement('link');
    a.href = readCookie("current-skin");
    a.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(a);
}


//Create Cookie Function
function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

//Read Cookie Function
function readCookie(name) {
    var nameEq = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEq) == 0) return c.substring(nameEq.length, c.length);
    }
    return null;
}

//Erase Cookie Function
function eraseCookie(name) {
    createCookie(name, "", -1);
}
