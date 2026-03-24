import asyncio
import os
from google import genai
from dotenv import load_dotenv

async def test_gemini_sys_instr():
    load_dotenv(".env")
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    
    sys_instr = "You are a helpful assistant."
    user_msg = "Hello"
    
    try:
        print("Calling Gemini with system instruction...")
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=user_msg,
            config=genai.types.GenerateContentConfig(
                system_instruction=sys_instr,
            ),
        )
        print("Response:", response.text)
    except Exception as e:
        print("Error Type:", type(e))
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_gemini_sys_instr())
