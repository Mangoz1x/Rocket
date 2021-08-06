function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

if (document.getElementById("theme-switcher-checkbox")) {
    document.getElementById("theme-switcher-checkbox").addEventListener("click", () => {
        checkThemeSwitcher();
    });

    function checkThemeSwitcher() {
        if (document.getElementById("theme-switcher-checkbox").checked == true) {
            setCookie("theme", "light", "180");
            checkTheme();
        } else {
            setCookie("theme", "normal", "1");
            checkTheme();
        }
    }
}

checkTheme();

function checkTheme() {
    if (getCookie("theme") == "light") {
        if (document.getElementById("theme-switcher-checkbox")) {
            document.getElementById("theme-switcher-checkbox").checked = true;
        }

        (function () {
            var css = 'html {-webkit-filter: invert(100%);' + '-moz-filter: invert(100%);' + '-o-filter: invert(100%);' + '-ms-filter: invert(100%); }';
            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('style');

            style.type = 'text/css';
            style.id = 'themeStyleSheet';

            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
        }());
    } else if (getCookie("theme") == "normal") {
        if (document.getElementById("theme-switcher-checkbox")) {
            document.getElementById("theme-switcher-checkbox").checked = false;
        }

        if (document.getElementById("themeStyleSheet")) {
            document.getElementById("themeStyleSheet").remove();  
        }
    }
}

