#!/usr/bin/env python3
import lmstudio as lms
from flask import Flask, request, jsonify, render_template

# --- Configuration Boilerplate ---
SERVER_API_HOST = "192.168.1.157:1234"
lms.configure_default_client(SERVER_API_HOST)

model = lms.llm("google/gemma-4-e4b")
# -------------------------------

app = Flask(__name__)

@app.route('/')
def index():
    """Renders the main spell checker page."""
    return render_template('index.html')

@app.route('/spellcheck', methods=['POST'])
def spellcheck():
    """Receives text and uses the LLM to perform spell checking and correction."""
    data = request.get_json()
    text_to_check = data.get('text', '')

    if not text_to_check:
        return jsonify({"error": "No text provided"}), 400

    # Crafting the prompt for the LLM to act as a spell checker
    prompt = f"""You are an expert spell-checker and grammar corrector. Your task is to review the following text and correct all spelling mistakes, grammatical errors, and improve clarity while maintaining the original meaning. Only return the corrected text, nothing else.

    Original Text: "{text_to_check}"

    You must output all after the Corrected Text: and nothing else
    """

    try:
        # Using the provided boilerplate to get the response from the local LLM
        result = model.respond(prompt)
        corrected_text = result.parsed.split("Corrected Text:")[-1].strip()
        print(result.parsed)
        return jsonify({"success": True, "corrected_text": corrected_text})
    except Exception as e:
        print(f"Error during spellcheck: {e}")
        return jsonify({"success": False, "error": f"An error occurred while communicating with the LLM server: {str(e)}"}), 500

if __name__ == '__main__':
    # Note: In a real deployment, you should use a proper WSGI server (like gunicorn)
    print("Starting Flask app. Ensure lmstudio is running at", SERVER_API_HOST)
    app.run(debug=True, port=5000)