//Import Librarys 
const url = require('url');
const fs = require('fs');
const http = require('http');
const xjs = require('./xeronscript');
const pages = require('./pages.js');
const users = require('./users/users');
const chalk = require('chalk');
const sqlFunction = require('./api/sql');
const bcrypt = require('bcrypt');
const { promisify } = require('util');
const crypto = require('crypto');

//global variables
global.hostname = "http://localhost:5000"

//Import json files
const extensions = JSON.parse(fs.readFileSync("extensions.json").toString());

//Create The Server
const server = http.createServer((req, res) => {
    console.log(chalk.red("NEW REQUEST"));
    //Obtain information about request
    //Get GET data
    let q = url.parse(req.url, true);
    let session = "";
    
    //Get POST data
    let body = "";
    req.on('data', (chunk) => {
        body += chunk;
    });
    
    //When all POST data is colleted from client
    req.on('end', () => {
        async function afterend() {
            let objection = false;
            
            //Get post
            let p = url.parse("localhost/post?" + body, true).query;
            
            //x has the settings for rendering
            let x = {
                "content": 404,
                "status": 404,
                "inject": {
                    "globalHeader": `
                    <link rel="shortcut icon" type="image/png" href="/img/favicon.png"/>
                `,
                "navbar": {
                    filename: "templates/navbar/nav.html",
                    plaintext: false,
                    javascript: false,
                    through: false
                },
                "user": false,
                "userLogged": false,
                "userVerified": false,
                    "test": [
                        "testant",
                        "testerant"
                    ]
                },
                "contentType": "text/html",
                "allow": {
                    "javascript": false,
                    "plaintext": true
                },
                "through": false,
                "user": false,
                "users": users.getUsers(),
                "cookies": xjs.parseCookies(req),
                "session": ""
            };
            
            //log the user out?
            if (p.logout == "true" || q.query.logout == "true") {
                x.session = "destroy";
                let sessionToken = x.cookies.sessionToken;
                if (sessionToken) {
                    await sqlFunction.delete("sessions", { token: sessionToken });
                }
            } else {
                //Get the credentials the user inputed
                let creds = {
                    username: p.username,
                    password: p.password,
                    usernameandpassword: true,
                    token: false
                }
                
                //Get the sessionToken
                let sessionToken = x.cookies.sessionToken;

                //Check for a token in cookies if post was not provided.
                if (!(creds.username && creds.password)) {
                    //username and password was not provided.
                    creds.usernameandpassword = false;
                    if (sessionToken) {
                        creds.token = true;
                        //token was provided
                        //check if token is in database

                        let result = "";
                        result = await sqlFunction.select("sessions", { token: sessionToken })
                        //If no results were returned
                        if (result.length > 0) {
                            //token exists
                            //login user based on token
                            
                            creds = {
                                token: sessionToken,
                                userId: result[0].userId,
                                usernameandpassword: false
                            }
                        }
                    }
                }
                
                if (creds.usernameandpassword) {
                    console.log("login by username and password")
                    //login by username and password
                    //Return the password to this variable
                    let returned = [null];
                    
                    //Get the result from the database
                    returned = await sqlFunction.select("users", { username: creds.username })
                    
                    //Check if it returned a result 
                    if (returned.length > 0) {
                        //username is correct
                        if (bcrypt.compareSync(creds.password, returned[0].password) == true) {
                            //Password is correct
                            x.user = returned[0];
                            
                            x.inject.userLogged = true;
                            
                            if (q.pathname.split("/")[1] == "login") {
                                objection = "loginComplete";
                            }
                        } else {
                            //Password is incorrect
                            x.user = false;
                        }
                    }
                } else if (creds.token) {
                    console.log("login by token")
                    //use login overide to only log in by username
                    let returned = [null];
                    
                    //Get the pwd from the database
                    await sqlFunction.select("users", { userId: creds.userId }).then(answer => {
                        if (answer.length > 0) {
                            returned = answer;
                        }
                        else {
                            returned = [null];
                        }
                    }).catch(error => { throw error; });

                    if (returned[0]) {
                        x.user = returned[0];
                    }
                }
            }

            if (x.user) {
                console.log(chalk.green("loggin succesfull"))

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

                let sessionMatchesCheck = await sqlFunction.select("sessions", { userId: x.user.userId });
                            
                if (sessionMatchesCheck.length > 0) {
                    sqlFunction.update("sessions", { token: x.session }, { userId: x.user.userId });
                } else {
                    sqlFunction.insert("sessions", {
                        token: x.session,
                        userId: x.user.userId
                    }).catch(error => { throw error; });
                }
                let birthday = new Date(x.user.birthday);
                x.inject.user = {
                    username: x.user.username,
                    publicId: x.user.publicId,
                    mail: x.user.mail,
                    birthday: birthday.getFullYear() +"-"+birthday.getMonth()+"-"+ birthday.getDay(),
                    fullname: x.user.fullName
                };
                
                
                x.inject.userLogged = true;
                if (x.user.verified == "true") x.inject.userVerified = true;
                
            }

            if (objection == "loginComplete") {
                x.inject.location = '/';
                x.content = fs.readFileSync('website/templates/redirect.html')
                x.status = 200;
                render(res, req, x);
                return;
            }
            
            //Get url to render specific file
            let pathname = q.pathname;
            if (pathname[pathname.length - 1] == "/") {
                pathname += "index.html";
            }

            //Get extension for file being rendered
            let ext = pathname.split(".").pop();
            
            //Check for errors and render files if none were found 
            let pathnameMini = pathname.split("/")[1];
            if (x.user.verified == "false") {
                let page = await pages["verify"](req, res, x, q, p);
                x = page.x;
            } else if (pages[pathnameMini]) {
                let page = await pages[pathnameMini](req, res, x, q, p);
                x = page.x;
            } else {
                try {
                    x.content = fs.readFileSync("website/public/" + pathname);
                    let fileProperties = xjs.getContentType(ext, extensions);
                    x.contentType = fileProperties.type + "/" + fileProperties.ext;
                    if (ext == "svg") x.contentType += "+xml"
                    if (fileProperties.type != "text") x.through = true;
                    x.status = 200;
                } catch (error) {
                    x.content = error;
                    x.status = 404;
                }
            }
            
            //call function
            render(res, req, x);
        }
        afterend()
    });
});

//Function to render the page
function render(res, req, x) {
    if (x.status == 404) {
        x.content = fs.readFileSync("website/templates/error.html");
        x.contentType = "text/html";
        x.inject.errorHeader = "404";
        x.inject.error = "Page Not Found";
    }
    if (x.status == 403) {
        x.content = fs.readFileSync("website/templates/error.html");
        x.contentType = "text/html";
        x.inject.errorHeader = "403";
        x.inject.error = "Access Denied"
    }
    if (x.status == 405) {
        x.content = fs.readFileSync("website/templates/error.html");
        x.contentType = "text/html";
        x.inject.errorHeader = "405";
        x.inject.error = "Method Not Allowed"
    }
    if (x.status == 415) {
        x.content = fs.readFileSync("website/templates/error.html");
        x.contentType = "text/html";
        x.inject.errorHeader = "415";
        x.inject.error = "Unsupported Media Type";
    }
    if (x.status == 418) {
        x.content = fs.readFileSync("website/templates/error.html");
        x.contentType = "text/html";
        x.inject.errorHeader = "418";
        x.inject.error = "I'm a teapot";
    }
    
    if (x.session == "destroy") {
        res.writeHead(x.status, {
            'content-type': x.contentType,
            'Set-Cookie': 'sessionToken=loggedout;Max-Age=-1;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        });
    } else if (x.user && x.session) {
        res.writeHead(x.status, {
            'content-type': x.contentType,
            'Set-Cookie': 'sessionToken=' + encodeURI(x.session) + "; Max-Age=86400; path=/"
        });
    } else {
        res.writeHead(x.status, {
            'content-type': x.contentType
        });
    }
    
    res.end(xjs.render(x.content, {
        "javascript": x.allow.javascript,
        "plaintext": x.allow.plaintext,
        "through": x.through
    }, x.inject))
}

//Listen on port 5000
server.listen(5000);