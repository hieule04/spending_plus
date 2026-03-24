import os
from google import genai
from dotenv import load_dotenv

def list_models():
    load_dotenv(".env")
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    try:
        print("Listing models...")
        for model in client.models.list():
            print(f"- {model.name}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    list_models()
