const fs = require("fs");
const bcrypt = require("bcrypt");
const mailService = require('./../mail/mail.js')
const crypto = require('crypto');

//Returns the parsed users.json file
exports.getUsers = function () {
    return JSON.parse(fs.readFileSync("users/users.json").toString());
}

//Stringifys the users object and writes to users.json
exports.saveUsers = function (users) {
    fs.writeFileSync("users/users.json", JSON.stringify(users, null, 4))
}

//Login the user
exports.login = function (users, username, password) {
    //Return the user from users
    if (users[username]) {
        //Is password correct
        if (bcrypt.compareSync(password, users[username].password) == true) {
            //Password is correct
            return { user: users[username] }
        } else {
            //Password is incorrect
            return { error: "password incorrect" }
        }
    } else {
        //Username not found
        return { error: "user not found" };
    }
}

//Login Overide
exports.loginOveride = function (users, username) {
    //Return the user from users
    if (users[username]) {
        //Password is correct
        return { user: users[username] }
        
    } else {
        //Username not found
        return { error: "user not found" };
    }
}

//Signup user
exports.signup = function (users, username, password, mail, bday) {
    //Variables to check is old enough
    let birthday = new Date(bday);
    let today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    let m = today.getMonth() - birthday.getMonth();

    //Check the variables and make sure the user is over the age of 14
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }

    //If the users age is less than 14
    if (age < 14) {
        return {error: "age invalid"};
    }

    //check username meets requirements
    let validateUsername = function (username) {
        //Usernames can only contain a-b, A-B, 0-9, _
        if (username.replace(/^[a-zA-Z0-9_]*$/g, "") == "") {
            return true;
        }
        return false;
    }

    //Error checking
    if (validateUsername(username) == false) {
        //Username does not meet requirments
        return { error: "username invalid"};
    } else if (users[username]) {
        //User already exists
        return { error: "username taken"};
    } else {
        //Check password is good
        //Password must be more than 7 digits long.
        if(password.length > 7) {
            //password is good
            let verification = mailService.generatecode();

            //Verification mail variables
            let to = mail;
            let subject = "Verify email for Rocket";
            let message = `<a href="http://localhost:5000/verify?token=${verification.toString()}%26privateId=${username}">Verify</a>`
            //Send mail to verify email
            mailService.mail(to, subject, message);

            return {
                user:{
                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                    username: username,
                    mail: mail,
                    verified: false,
                    verification: verification,
                    birthday: birthday,
                    created: new Date
                }
            };
        } else {
            return {error: "Password is to short or invalid"};
        }
    }
}

//Validate username algo
exports.validateUsername = function (username) {
    //Usernames can only contain a-b, A-B, 0-9, _
    if (username.replace(/^[a-zA-Z0-9_]*$/g, "") == "") {
        return true;
    }
    
    return false;
}
