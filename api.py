#!/usr/bin/env python3

from re import match
from os import environ
from json import loads
from openai import AsyncOpenAI
from google import genai
from asyncio import sleep
from hashlib import sha256
from os.path import dirname
from fastapi import APIRouter, WebSocket
from logging import INFO, getLogger, Formatter
from logging.handlers import RotatingFileHandler
from google.genai.types import Content, Part

for line in open(f"{dirname(__file__)}/.env").readlines():
    if not line.strip().startswith("#") and "=" in line:
        key, value = [x.strip() for x in line.split("=", 1)]
        environ[key] = value[1:-1] if match(r'["\']', value) else value

openai = AsyncOpenAI()
client = genai.Client(
    api_key=environ["GEMINI_API_KEY"], http_options={"api_version": "v1alpha"}
)
router = APIRouter(prefix="/api/llm")
salt = environ["SALT"]

logger = getLogger()
logger.setLevel(INFO)
handler = RotatingFileHandler("llm/log/app.log", maxBytes=100 * 1024, backupCount=10)
handler.setFormatter(Formatter("[%(asctime)s] %(message)s"))
logger.addHandler(handler)

system = "Answer in markdown format. For programming questions, no explanation is required, just show the code."
logger.info(f"SYSTEM: {system}")


@router.websocket("/ws/{hash}")
async def websocket_endpoint(hash, websocket: WebSocket):
    await websocket.accept()
    text = await websocket.receive_text()
    if hash != sha256((salt + text).encode()).hexdigest():
        await websocket.send_text("認証エラー")
        return
    d = loads(text)
    messages = d["messages"]
    model = d["model"]
    provider = d["provider"]
    logger.info(f"MODEL: {model}")
    logger.info(f"PROMPT: {messages[-1]['content']}")
    answer = ""
    if provider == "gemini":
        history = []
        for message in messages[:-1]:
            role = "user" if message["role"] == "user" else "model"
            parts = [Part.from_text(message["content"])]
            history.append(Content(role=role, parts=parts))
        chat = client.aio.chats.create(model=model, history=history)
        chat._config = {"system_instruction": system}
        if "thinking" in model:
            chat._config["thinking_config"] = {"include_thoughts": True}
            answer += "> \\#### thought ####\n"
            await websocket.send_text("> \\#### thought ####\n\n")
        thought_flag = False
        response = chat.send_message_stream(messages[-1]["content"])
        async for chunk in response:
            if chunk.candidates is None:
                continue
            part: Part = chunk.candidates[0].content.parts[0]
            if part.thought:
                thought_flag = True
            elif thought_flag:
                thought_flag = False
                answer += "\n> \\#### answer ####\n"
                await websocket.send_text("\n> \\#### answer ####\n\n")
            answer += part.text
            await websocket.send_text(part.text)
            await sleep(0)
    else:
        stream_response = await openai.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": system},
                {"role": "assistant", "content": "Sure! Please provide the question."},
                *messages,
            ],
            stream=True,
        )
        async for chunk in stream_response:
            if chunk.choices[0].delta.content:
                answer += chunk.choices[0].delta.content
                await websocket.send_text(chunk.choices[0].delta.content)
                await sleep(0)
    logger.info(f"RESPONSE: {answer}")
    await websocket.close()
