import json
import logging

logger = logging.getLogger(__name__)

def sanitize_llm_output(raw_content: str) -> str:
    """
    Cleans up LLM output by removing markdown code blocks and extracting the JSON object.
    """
    content = raw_content.strip()
    
    # Remove markdown blocks if present
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    
    if content.endswith("```"):
        content = content[:-3]
        
    return content.strip()