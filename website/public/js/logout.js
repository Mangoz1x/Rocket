let form = document.getElementById("logoutForm");
if (form) {
    let formSubmitBtn = document.getElementById("logoutFormSubmit");

    formSubmitBtn.addEventListener("click", () => {
        form.submit();
    });
}

let formResponsive = document.getElementById("logoutFormResponsive");
if (formResponsive) {
    let formSubmitBtn = document.getElementById("logoutFormSubmitResponsive");

    formSubmitBtn.addEventListener("click", () => {
        form.submit();
    });
}