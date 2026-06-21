#!/usr/bin/env python3
import lmstudio as lms

SERVER_API_HOST = "192.168.1.157:1234"
lms.configure_default_client(SERVER_API_HOST)

model = lms.llm("google/gemma-4-e4b")
result = model.respond("What is the meaning of life?")
print(result)