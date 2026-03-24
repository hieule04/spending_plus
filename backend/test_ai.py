import asyncio
import os
from google import genai
from dotenv import load_dotenv

async def test_gemini():
    load_dotenv(".env")
    api_key = os.getenv("GOOGLE_API_KEY")
    print(f"Testing with API Key: {api_key[:10]}...")
    
    client = genai.Client(api_key=api_key)
    try:
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents="Say hello"
        )
        print("Response:", response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_gemini())
