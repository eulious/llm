#!/usr/bin/env python3

from re import match
from os import environ
from json import loads
from openai import AsyncOpenAI
from google import generativeai
from hashlib import sha256
from os.path import dirname
from fastapi import APIRouter, WebSocket
from logging import INFO, getLogger, Formatter
from logging.handlers import RotatingFileHandler
from google.generativeai import GenerativeModel

for line in open(f"{dirname(__file__)}/.env").readlines():
    if not line.strip().startswith("#") and "=" in line:
        key, value = [x.strip() for x in line.split("=", 1)]
        environ[key] = value[1:-1] if match(r'["\']', value) else value

openai = AsyncOpenAI()
generativeai.configure(api_key=environ["GEMINI_API_KEY"])
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
    name = d["name"]
    logger.info(f"MODEL: {model}")
    logger.info(f"PROMPT: {messages[-1]['content']}")
    answer = ""
    if name == "gemini":
        model = GenerativeModel(model, system_instruction=[system])
        new_messages = []
        for message in messages:
            role = "user" if message["role"] == "user" else "model"
            new_messages.append({"role": role, "parts": [message["content"]]})
        response = await model.generate_content_async(new_messages, stream=True)
        async for chunk in response:
            answer += chunk.candidates[0].content.parts[0].text
            await websocket.send_text(chunk.candidates[0].content.parts[0].text)
    else:
        stream_response = await openai.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system}, *messages],
            stream=True,
        )
        async for chunk in stream_response:
            if chunk.choices[0].delta.content:
                answer += chunk.choices[0].delta.content
                await websocket.send_text(chunk.choices[0].delta.content)
    logger.info(f"RESPONSE: {answer}")
