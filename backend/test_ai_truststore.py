import asyncio
import os
import ssl
from google import genai
from dotenv import load_dotenv

def _build_ssl_verify():
    try:
        import truststore
        ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        print("[*] Testing with truststore SSLContext")
        return ctx
    except Exception as e:
        print("Truststore failed:", e)
        return True

async def test_gemini_truststore():
    load_dotenv(".env")
    api_key = os.getenv("GOOGLE_API_KEY")
    ssl_verify = _build_ssl_verify()
    
    client = genai.Client(
        api_key=api_key,
        http_options=genai.types.HttpOptions(
            client_args={"verify": ssl_verify},
            async_client_args={"verify": ssl_verify},
        )
    )
    
    try:
        print("Calling Gemini...")
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents="Say hello"
        )
        print("Response:", response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_gemini_truststore())
