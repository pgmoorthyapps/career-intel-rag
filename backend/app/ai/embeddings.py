import httpx
from typing import List
from fastapi import HTTPException
from app.core.config import settings

class EmbeddingClient:
    @staticmethod
    async def get_embedding(text: str) -> List[float]:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API key missing")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={settings.GEMINI_API_KEY}"
        
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            },
            "outputDimensionality": 768 
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            
            if not response.is_success:
                print(f"Gemini API Error: {response.text}")
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Embedding API failed: {response.text}"
                )
                
            data = response.json()
            embedding = data.get("embedding", {}).get("values", [])
            
            if not embedding:
                raise HTTPException(status_code=500, detail="Failed to generate embedding")
            
            return embedding[:768]