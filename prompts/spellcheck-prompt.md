Can you make a small python based website that has an input field and an output.

The application should be a spell checker, so whatever I put in should be spellchecked and corrected as in the output.

The python code should use the following as a boiler plate to use the lmstudio sdk to let the model fix the spell checking. All work should be output in the spellcheck/ folder to the workspace

    SERVER_API_HOST = "192.168.1.158:1234"
    lms.configure_default_client(SERVER_API_HOST)

    model = lms.llm("google/gemma-4-e4b")
    result = model.respond("What is the meaning of life?")
    print(result)

The webapp frontend should be based on simple plain html, css and js.

Consider using http.server to serve the frontend

    python -m http.server 8000

Make websockets (or simple POST requests) to handle data between front and backend.
Fx there seems to be a socketserver API.