const request = require('request');
const crypto = require('crypto');

exports.generatecode = function generatecode() {
    //Create array with letters and numbers 
    let code = ""

    //Get Random characters and generate token
    code += crypto.randomBytes(32).toString("hex");

    //Return the code 
    return code;
}

//Mail to user 
exports.mail = function mail(to, subject, message) {
    //Email variables 
    to = encodeURI(to);
    messgae = encodeURI(message);
    subject = encodeURI(subject);
    //Create options variable that contains information and get req info
    console.log("Sending mail to " + to)
    let options = {
        'method': 'GET',
        'url': 'https://bluhorse.ca/emailapi/?to=' + to + '&subject=' + subject + '&message=' + message,
        'headers': {}
    };

    //Create the request based of the given password 
    request(options, function (error, response) {
        if (error) throw new Error(error);
    });
}
