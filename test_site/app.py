from pathlib import Path

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

# with open(Path("initial/xss.js"), "r") as f:
#     data = f.read()

with open(Path("c2/polling.js"), "r") as f:
    data = f.read()


@app.route("/")
def hello_world():
    return (
        f"This is home!<br><a href='/'>Go to home</a> "
        f"OR <a href='/two'>Go to two</a>"
        f"<br><script>{data}</script>"
    )


@app.route("/one")
def one():
    return "This is one<br><a href='/'>Go to home</a> OR <a href='/two'>Go to two</a>"


@app.route("/two")
def two():
    return "This is two<br><a href='/'>Go to home</a> OR <a href='/one'>Go to one</a>"
