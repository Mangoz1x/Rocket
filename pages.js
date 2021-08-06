const fs = require("fs");
const users = require('./users/users');
const mailService = require('./mail/mail');
const xjs = require('./xeronscript')
const sqlFunction = require('./api/sql')
const bcrypt = require("bcrypt");
const crypto = require("crypto")

//Create an api
exports.api = function (req, res, x, q, p) {
    x.inject.api = "unknown request";

    if (q.query.checklogin) {
        //Get user credentials 
        let username = q.query.username;
        let password = q.query.password;

        //have they given credentials?
        if (username && password) {
            //Login user
            let user = users.login(x.users, username, password);

            //If an error is generated show the error in the page the user is in
            if (user.error) {
                x.inject.api = "incorrect"
            }
            else {
                x.inject.api = "correct"
            }
        }
    } else if (q.query.signup) {
        //Get user credentials 
        let username = q.query.SUusername;
        let password = q.query.SUpassword;
        let mail = q.query.SUmail;
        let bday = q.query.SUbday;

        let returning = { response: [], token: false, loggedIn: false, verified: false };

        //Was Credentials provided?
        if (username && password && mail && bday) {
            //Signup user
            x.user = users.signup(x.users, username, password, mail, bday);

            //Verification
            if (x.user.error) {
                //Login failed
                returning.response.push(x.user.error)
                x.user = false;
            } else {
                //Setting x 
                x.user = x.user.user
                x.users[x.user.username] = x.user

                if (password.length > 7) {
                    //password is good
                    let verification = mailService.generatecode();

                    //Verification mail variables
                    let to = mail;
                    let subject = "Verify email for Rocket";
                    let message = `<a href="${hostname}/verify?token=${verification.toString()}%26username=${username}">Verify</a>`
                    //Send mail to verify email
                    mailService.mail(to, subject, message);

                    //Create the user
                    x.inject.user = {
                        "username": x.user.username,
                        "created": x.user.created,
                        "mail": x.user.mail,
                        "bday": x.user.birthday
                    }
                }


                //Set the user to be logged in through the backend
                x.inject.userLogged = true;
                returning.loggedIn = true;
                x.inject.verified = x.user.verified;

                x.session = "";
                x.session += crypto.randomBytes(Math.random() * (128 - 224) + 128).toString("hex");


                while (x.sessions[x.session]) {
                    x.session = "";
                    x.session += crypto.randomBytes(Math.random() * (128 - 224) + 128).toString("hex");
                }

                x.sessions[x.session] = {
                    username: x.user.username
                }

                fs.writeFileSync("sessions.json", JSON.stringify(x.sessions, null, 4))

                //Send data to page
                returning.token = x.session;
            }
        }

        //Try to return a response 
        try {
            x.inject.api = JSON.stringify(returning);
        } catch (error) {
            x.inject.api = "ERROR"
        }
    }

    x.contentType = "text/plain";
    x.content = "{{xjs api xjs}}";
    x.status = 200;
    return { req, res, x };
}

//Login user
exports.login = function (req, res, x, q, p) {
    //Render the login page with a status of 200
    x.content = fs.readFileSync("website/public/login/login.html");
    x.contentType = "text/html";
    x.status = 200;

    let password = p.password;
    let username = p.username;
    let errors = [];

    if (p.login) {
        if (typeof x.user == "object") {
            errors.push("You are already logged in!")
        } else {
            if (password && username) {
                //find user by username
                let answer = sqlFunction.select("users", { username: username });
                if (answer.length > 0) {
                    let tempUser = answer;
                    //user exists
                    if (bcrypt.compareSync(password, tempUser.password) == true) {
                    } else {
                        //Password is incorrect
                        errors.push("Incorrect Username or Password!")
                    }
                } else {
                    //user not found
                    errors.push("Incorrect Username or Password!")
                }
            }
            else {
                errors.push("Please fill out the form!")
            }
        }

    }

    //Return the data
    x.inject.alert = errors;
    return { req, res, x };

}

//Signup user
exports.signup = async function (req, res, x, q, p) {
    x.content = fs.readFileSync("website/public/signup/signup.html");
    x.contentType = "text/html";
    x.status = 200;

    //Get user credentials 
    let password = p.SUpassword;
    let username = p.SUusername;
    let fullname = p.SUfullname;
    let mail = p.SUmail;
    let bday = p.SUbday;
    let errors = [];

    //did they push the button?
    if (p.signup) {

        //Was Credentials provided?
        if (username && password && mail && bday && fullname) {
            //sign up the user
            //Query to check if the username exists
            let answerUsers = await sqlFunction.select("users", { username: username });

            //Query to check if the email exists
            let answerEmail = await sqlFunction.select("users", { mail: mail });

            //Check if the username is already in use
            if (answerUsers.length > 0) {
                errors.push("Username Taken!");
            }

            //Check if the email is already in use
            if (answerEmail.length > 0) {
                errors.push("Email Is Already In Use!");
            }

            //check password meets requirements
            if (password.length > 7 && password.length < 513 && password.replace(/^[a-zA-Z0-9_!@#$%^&*()-=+"'{}:`~;,<.>\\/\[\]]*$/g, "") == "") {
                //The password is ok
            } else {
                //the password is to short or has invalid charactars or is to long
                errors.push("Password is invalid!");
            }

            //check username meets requirements
            if (username.replace(/^[a-zA-Z0-9_]*$/g, "") == "" && username.length > 2 && username.length < 30) {
                //username is good to go!
            } else {
                errors.push("Username is invalid!");
            }

            //check mail meets requirements
            if (mail.length > 3 && mail.length < 513) {
                //mail is correct
            } else {
                errors.push("Mail is invalid!")
            }

            //check age meets requirments
            if (bday.length > 3 && bday.length < 513) {
                //age is good
            } else {
                errors.push("Birthday is invalid!")
            }

            //check full name meets requirments
            if (fullname.length > 2 && fullname.length < 513) {
                //fullname is good
            } else {
                errors.push("Full Name is invalid!")
            }

            //check age
            let birthday = new Date(bday);
            let today = new Date();
            let age = today.getFullYear() - birthday.getFullYear();
            let m = today.getMonth() - birthday.getMonth();
            console.log(birthday)

            //Check the variables and make sure the user is over the age of 14
            if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
                age--;
            }

            //If the users age is less than 14
            if (age < 14) {
                errors.push("Not old enough!")
            }

            //Check to check if the username or email already exists
            if (answerUsers.length > 0 && answerEmail > 0) {
                //they already exists
            } else {
                //Check one more time if there are any errors
                if (errors.length < 1) {
                    //they are good to go & run the sql function to insert the user.
                    let verification = mailService.generatecode();
                    let userId = "";
                    let userIdmatters = 0;

                    userId += crypto.randomBytes(Math.floor(Math.random() * (128 - 58) + 58)).toString("hex");

                    await sqlFunction.select("users", { userId: userId }).then(answer => {
                        userIdmatters = answer.length
                    }).catch(error => { throw error; });

                    while (userIdmatters > 0) {
                        userId = "";
                        userId += crypto.randomBytes(Math.floor(Math.random() * (128 - 58) + 58)).toString("hex");


                        await sqlFunction.select("users", { userId: userId }).then(answer => {
                            userIdmatters = answer.length
                        }).catch(error => { throw error; });
                    }

                    //CREATE A SESSION TOKEN
                    x.session = "";
                    let sessionmatters = 0;

                    x.session += crypto.randomBytes(Math.floor(Math.random() * (368 - 224) + 224)).toString("hex");

                    await sqlFunction.select("sessions", { token: x.session }).then(answer => {
                        sessionmatters = answer.length
                    }).catch(error => { throw error; });

                    while (sessionmatters > 0) {
                        x.session = "";
                        x.session += crypto.randomBytes(Math.floor(Math.random() * (368 - 224) + 224)).toString("hex");

                        await sqlFunction.select("sessions", { token: x.session }).then(answer => {
                            sessionmatters = answer.length
                        }).catch(error => { throw error; });
                    }
                    await sqlFunction.insert("sessions", {
                        token: x.session,
                        userId: userId
                    }).catch(error => { throw error; });

                    //log the user in server side
                    x.user = {
                        password: bcrypt.hashSync(password, bcrypt.genSaltSync(12)),
                        fullName: fullname,
                        username: username,
                        userId: userId,
                        privateId: crypto.randomBytes(Math.floor(Math.random() * (58 - 25) + 25)).toString("hex"),
                        publicId: crypto.randomBytes(Math.floor(Math.random() * (58 - 25) + 25)).toString("hex"),
                        mail: mail,
                        verified: "false",
                        verification: verification,
                        birthday: birthday.toString(),
                        created: new Date
                    }
                    console.log(x.user.birthday);
                    x.inject.userLogged = true;
                    //Verification mail variables
                    let to = mail;
                    let subject = "Verify email for Rocket";
                    let message = `<a href="${hostname}/verify?token=${verification.toString()}%26privateId=${x.user.privateId}">Verify</a>`
                    //Send mail to verify email
                    mailService.mail(to, subject, message);

                    await sqlFunction.insert("users", x.user).catch(error => { throw error; });
                    x.inject.location = '/verify';
                    x.content = fs.readFileSync('website/templates/redirect.html')
                    x.status = 200;
                    return { req, res, x }
                }
            }
        }
        else {
            errors.push("Please fillout all fields!")
        }
    }

    x.inject.alert = errors;
    return { req: req, res: res, x: x }
}

//Verification page
exports.verify = async function (req, res, x, q, p) {
    x.content = fs.readFileSync("website/public/verify/verify.html");
    x.contentType = "text/html";
    x.status = 200;
    x.inject.loginUser = true;
    x.inject.mailer = "";
    x.inject.mailerError = [];
    x.inject.redirectLocations = { "home": "/", "login": "/login", "default": "/login" }

    if (q.query.token && q.query.privateId) {
        //Query the database
        let answer = await sqlFunction.select("users", { privateId: q.query.privateId });
        if (answer.length > 0) {
            let tempUser = answer[0];
            //user exists
            if (tempUser.verification == q.query.token) {
                //token is correct
                tempUser.verified = "true";

                await sqlFunction.update("users", { verified: tempUser.verified }, { userId: tempUser.userId });
                tempUser = undefined;
                x.inject.loginUser = true;
                x.inject.redirectLocations.default = x.inject.redirectLocations.home;

                //End the program instead of changing loginUser back to false
                return { req, res, x };
            } else {
                //token provided outdated
                x.inject.mailerError.push("Oops, your verification token is invalid or outdated.")
            }
        } else {
            //user does not exist
            x.inject.mailerError.push("Oops, we could not find your account, please loggin.");
        }
    }

    if (x.user) {
        if (x.user.verified == "false") x.inject.loginUser = false;
    }

    if (p.resetEmailRocket) {
        if (x.user.verified == "false") {
            if (p.rocketEmailResetEmail) {
                if (p.rocketEmailResetEmail.length > 3 && p.rocketEmailResetEmail.length < 513) {
                    //mail is correct
                    let verification = mailService.generatecode();

                    //Verification mail variables
                    let to = p.rocketEmailResetEmail;
                    let subject = "Verify email for Rocket";
                    let message = `<a href="${hostname}/verify?token=${verification.toString()}%26privateId=${x.user.privateId}">Verify</a>`
                    //Send mail to verify email
                    mailService.mail(to, subject, message);
                    x.user.mail = p.rocketEmailResetEmail;
                    x.user.verification = verification;

                    await sqlFunction.update("users", { mail: x.user.mail, verification: x.user.verification }, { userId: x.user.userId });

                    x.inject.mailer = "Verification email sent to " + to;
                } else {
                    x.inject.mailerError.push("Mail is invalid!")
                }

            } else {
                x.inject.mailerError.push("No Email Provided!");
            }
        } else {
            //user is already verified
            //I check for this so nobody can unwillingly change a email
            //though it is highly unlikely this is a week point anyway.
            x.inject.mailerError.push("Already Verified.");
        }
    }

    return { req, res, x };
}

exports.brewing = function (req, res, x, q, p) {
    x.status = 418;
    return { req, res, x };
}

exports.profile = function (req, res, x, q, p) {
    x.content = fs.readFileSync("website/templates/profile.html");
    x.contentType = "text/html";
    x.status = 200;
    if(!x.user) {
        x.content = fs.readFileSync("website/templates/redirect.html");
        x.inject.location = "login"
    }
    return {req, res, x};
}