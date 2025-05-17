import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure the API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use the correct model name for public API
model = genai.GenerativeModel("gemini-2.0-flash")

def get_gemini_response(prompt):
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error: {str(e)}"
