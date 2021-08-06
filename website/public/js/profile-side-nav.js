let userInfo = document.getElementById("user-info");
let userSettings = document.getElementById("user-settings");

//Show user information onclick
userInfo.addEventListener("click", () => {
    let userInfoArea = document.getElementById("profile-container");
    let settingsInfoArea = document.getElementById("profile-settings-container");

    if (['none'].includes(userInfoArea.style.display)) {
        userInfoArea.style.display = "block";    

        if (['', 'block', 'flex'].includes(settingsInfoArea.style.display)) {
            settingsInfoArea.style.display = "none";
        }
    }
});

//Show user settings onclick
userSettings.addEventListener("click", () => {
    let userInfoArea = document.getElementById("profile-container");
    let settingsInfoArea = document.getElementById("profile-settings-container");

    if (['', 'block'].includes(userInfoArea.style.display)) {
        userInfoArea.style.display = "none";

        if (['none'].includes(settingsInfoArea.style.display)) {
            settingsInfoArea.style.display = "block";
        }
    }
})

