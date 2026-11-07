import json
import httpx
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.analysis import MatchAnalysisResponse
from app.ai.prompts import (
    SYSTEM_PROMPT_ANALYSIS, get_analysis_user_prompt,
    SYSTEM_PROMPT_CHAT, get_chat_user_prompt
)

class LLMClient:
    @staticmethod
    async def analyze_resume_vs_jd(resume_text: str, job_description: str) -> MatchAnalysisResponse:
        if settings.GROQ_API_KEY:
            try:
                return await LLMClient._call_groq_analysis(resume_text, job_description)
            except Exception as e:
                print(f"Groq failed: {e}")
        
        if settings.GEMINI_API_KEY:
            try:
                return await LLMClient._call_gemini_analysis(resume_text, job_description)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Both LLMs failed. Last error: {str(e)}")
        
        raise HTTPException(status_code=500, detail="No LLM API keys configured.")

    @staticmethod
    async def _call_groq_analysis(resume_text: str, job_description: str) -> MatchAnalysisResponse:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        schema_str = json.dumps(MatchAnalysisResponse.model_json_schema())
        
        payload = {
            "model": "openai/gpt-oss-20b", 
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_ANALYSIS + f"\nOutput MUST match this JSON Schema: {schema_str}"},
                {"role": "user", "content": get_analysis_user_prompt(resume_text, job_description)}
            ],
            "temperature": 0.0,
            # "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if not response.is_success:
                print(f"Groq Error: {response.status_code} - {response.text}")
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return MatchAnalysisResponse.model_validate_json(content)

    @staticmethod
    async def _call_gemini_analysis(resume_text: str, job_description: str) -> MatchAnalysisResponse:
         url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        schema_str = json.dumps(MatchAnalysisResponse.model_json_schema())
        prompt = f"{SYSTEM_PROMPT_ANALYSIS}\nOutput Schema: {schema_str}\n\n{get_analysis_user_prompt(resume_text, job_description)}"

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            if not response.is_success:
                print(f"Gemini Error: {response.status_code} - {response.text}")
            response.raise_for_status()
            data = response.json()
            text_content = data["candidates"][0]["content"]["parts"][0]["text"]
            return MatchAnalysisResponse.model_validate_json(text_content)

    @staticmethod
    async def chat_with_context(resume_context: str, job_description: str, question: str) -> str:
        if not settings.GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="Groq API key missing for chat.")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-oss-20b",  
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_CHAT},
                {"role": "user", "content": get_chat_user_prompt(resume_context, job_description, question)}
            ],
            "temperature": 0.3
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if not response.is_success:
                print(f"Groq Chat Error: {response.status_code} - {response.text}")
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]