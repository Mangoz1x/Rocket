const fs = require("fs");

exports.render = function (content, contentExtra, inject, x) {
    if (contentExtra.through == true) return content;
    content = content.toString();
    let array = content.split("{{xjs");
    let section = [];
    let code = "";
    let rest = [];
    let result = null;
    let encode = (text, enco) => {
        if ((enco === undefined || enco == true) || (!contentExtra.plaintext)) {
            if (typeof text == "undefined" || typeof text == "symbol" || typeof text == "function") return "";
            return text.toString().replace(/[\u00A0-\u9999<>\&]/g, function (i) {
                return '&#' + i.charCodeAt(0) + ';';
            });
        }
        else {
            return text;
        }
    }
    let follow = (text, object) => {
        try {
            text = text.replace(/\s+/g, '').split("~");
            let adr = object;
            for (let c in text) {
                adr = adr[text[c]]
            }
            return adr
        }
        catch (error) {
            return error;
        }
    }
    for (let i in array) {
        if (array[i].includes("xjs}}")) {
            let code = array[i].split("xjs}}")[0];
            let rest = array[i].split("xjs}}");
            let encoder = true;
            rest.shift();
            if (code.includes("{--plaintext--}")) {
                code = code.replace("{--plaintext--}", "");
                encoder = false;
            }
            let checkIF = true;
            if (code.includes("{--IF--}")) {
                code = code.replace("{--IF--}", "");
                let aryy = code.substring(code.indexOf("{++") + 3, code.indexOf("++}"));
                code = code.replace("{++" + aryy + "++}", "");
                aryy = aryy.split("")
                if (aryy[0] == "!") {
                    aryy.shift();
                    aryy = aryy.join("");

                    let arryy = follow(aryy, inject);
                    if (typeof arryy != "undefined") {
                        if (arryy.toString()) {
                            if (arryy) {
                                checkIF = false;
                                section[i] = rest;

                            }
                        }
                    }
                    else {
                        checkIF = false;
                        section[i] = rest;
                    }

                } else {
                    aryy = aryy.join("");
                    let arryy = follow(aryy, inject);
                    if (typeof arryy != "undefined") {
                        if (arryy.toString()) {
                            if (arryy) {

                            }
                            else {
                                checkIF = false;
                                section[i] = rest;
                            }
                        }
                    }
                    else {
                        checkIF = false;
                        section[i] = rest;
                    }

                }
            }
            if (checkIF == true) {
                if (code.includes("{--JS--}") && contentExtra.javascript) {
                    let tempFunction = new Function("n", code.replace("{--JS--}"))
                    try {
                        result = tempFunction(inject);
                    }
                    catch (error) {
                        result = { encode: true, content: error.toString() };
                    }
                    if (result == undefined) {
                        result = { encode: false, content: "" };
                    }
                    section[i] = encode(result.content, encoder) + rest;
                    tempFunction = undefined;
                } else if (code.includes("{--find--}")) {
                    code = code.replace("{--find--}", "");
                    let ary = code.substring(code.indexOf("{++") + 3, code.indexOf("++}"));
                    let arry = follow(ary, inject)
                    if (arry) {
                        code = code.replace("{++" + ary + "++}", "");
                        let saction = [];
                        let cade = code.split("{[");
                        for (let a in cade) {
                            if (cade[a].includes("]}")) {
                                let template = cade[a].split("]}")[0];
                                let rast = cade[a].split("]}");
                                rast.shift();
                                saction[a] = encode(follow(template, arry), encoder) + rast;
                            }
                            else {
                                saction[a] = cade[a];
                            }
                        }
                        section[i] = saction.join("") + rest;
                    }
                } else if (code.includes("{--each--}")) {
                    code = code.replace("{--each--}", "");
                    let ary = code.substring(code.indexOf("{++") + 3, code.indexOf("++}"));
                    let arry = follow(ary, inject);
                    if (arry) {
                        let puzzle = [];
                        if (Array.isArray(arry) || typeof arry == "string") {
                            code = code.replace("{++" + ary + "++}", "");
                            for (let b in arry) {
                                let saction = [];
                                let cade = code.split("{[");
                                for (let a in cade) {
                                    if (cade[a].includes("]}")) {
                                        let template = cade[a].split("]}")[0];
                                        let rast = cade[a].split("]}");
                                        template = template.split("~");
                                        for (let d in template) {
                                            if (template[d] == "i") {
                                                template[d] = b;
                                            }
                                        }
                                        template = template.join("~");
                                        rast.shift();

                                        saction[a] = encode(follow(template, arry), encoder) + rast;

                                    }
                                    else {
                                        saction[a] = cade[a];
                                    }
                                }
                                puzzle[b] = saction.join("");
                            }
                        }
                        section[i] = puzzle.join("") + rest;
                    }
                } else if (code.includes("{--for--}")) {
                    code = code.replace("{--for--}", "");
                    let ary = code.substring(code.indexOf("{++") + 3, code.indexOf("++}"));
                    let arry = follow(ary, inject);
                    let count = 0;
                    if (Array.isArray(arry) || typeof arry == "string") {
                        count = arry.length
                    } else if (ary.includes("#")) {
                        count = parseInt(ary.replace("#", ""));
                    } else {
                        count = parseInt(arry);
                    }

                    if (count) {
                        let puzzle = [];

                        code = code.replace("{++" + ary + "++}", "");

                        for (let b = 0; b < count; b++) {
                            let saction = [];
                            let cade = code.split("{[");
                            for (let a in cade) {
                                if (cade[a].includes("]}")) {
                                    let template = cade[a].split("]}")[0];
                                    let rast = cade[a].split("]}");
                                    rast.shift();
                                    if (template.includes("#")) {
                                        template = template.replace("#", "").replace("i", b);
                                        for (let d in template) {
                                            if (template[d] == "i") {
                                                template[d] = b;
                                            }
                                        }
                                        saction[a] = encode(template, encoder) + rast;
                                    }
                                    else {
                                        template = template.split("~");
                                        for (let d in template) {
                                            if (template[d] == "i") {
                                                template[d] = b;
                                            }
                                        }
                                        template = template.join("~");

                                        saction[a] = encode(follow(template, inject), encoder) + rast;
                                    }
                                }
                                else {
                                    saction[a] = cade[a];
                                }
                            }
                            puzzle[b] = saction.join("");
                        }
                        section[i] = puzzle.join("") + rest;
                    }
                }
                else if (code.includes("{--run--}")) {
                    code = code.replace("{--run--}", "");
                    section[i] = encode(follow(code, inject)(), encoder) + rest;
                }
                else if (code.includes("{--render--}")) {
                    code = code.replace("{--render--}");
                    let parameters = code.split("{[")[1];
                    parameters = parameters.split("]}")[0];
                    if (parameters.includes("@")) {
                        //try and read from injected
                        parameters = parameters.replace("@", "");
                        parameters = follow(parameters, inject);
                    }
                    else {
                        //queries included
                        parameters = parameters.split("|");
                        let truths = [false, false, false, false, false];
                        if(parameters[1] == "true") {
                            truths[1] = true;
                        }
                        if(parameters[2] == "true") {
                            truths[2] = true;
                        }
                        if(parameters[3] == "true") {
                            truths[3] = true;
                        }
                        
                        parameters = {
                            filename: parameters[0],
                            plaintext: truths[1],
                            javascript: truths[2],
                            through: truths[3]
                        };
                    }
                    let Rcontent = fs.readFileSync("website/" + parameters.filename);
                    section[i] = this.render(Rcontent, {
                        "javascript": parameters.javascript,
                        "plaintext": parameters.plaintext, 
                        "through": parameters.through
                    }, inject) + rest;
                    
                }
                else {
                    section[i] = encode(follow(code, inject), encoder) + rest;
                }
            }
        }
        else {
            section[i] = array[i];
        }
    }
    return section.join("");
}

exports.ext = function (path) {
    path = path.split(".");
    return path[path.length - 1]
}

exports.getContentType = function (ext, extensions) {
    for (let i in extensions) {
        for (let a = 1; a < extensions[i].length; a++) {
            if (ext == extensions[i][a]) {
                return { "type": extensions[i][0], "ext": ext };
            }
        }
    }
    return { "type": 404 };
}

exports.parseCookies = function (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

exports.encode = function (text) {
    if (typeof text == "undefined" || typeof text == "symbol" || typeof text == "function") return "";
    return text.toString().replace(/[\u00A0-\u9999<>\&]/g, function (i) {
        return '&#' + i.charCodeAt(0) + ';';
    });
}