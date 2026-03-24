import os
from google import genai
from dotenv import load_dotenv

def test_gemini_sync():
    load_dotenv(".env")
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    
    try:
        print("Calling Gemini (SYNC)...")
        # Without .aio
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents="Say hello"
        )
        print("Response:", response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_gemini_sync()
