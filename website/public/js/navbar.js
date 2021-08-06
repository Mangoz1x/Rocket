if (document.getElementById("responsiveNavBarShow")) {
    let navBtn = document.getElementById("responsiveNavBarShow");
    let closeNavBtn = document.getElementById("responsiveNavBarHide");
    let responsiveNav = document.getElementById("responsiveNavArea");

    navBtn.addEventListener("click", () => {
        if (responsiveNav.style.display == "none") {
            responsiveNav.style.display = "block";
            document.body.style.overflow = 'hidden';
        }
    });

    closeNavBtn.addEventListener("click", () => {
        if (responsiveNav.style.display == "block") {
            responsiveNav.style.display = "none";
            document.body.style = "";
        }
    });
}