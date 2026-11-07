from pydantic import BaseModel, Field
from typing import List

class SkillGap(BaseModel):
    missing_skill: str = Field(..., description="The specific skill missing from the resume")
    importance: str = Field(..., description="High, Medium, or Low based on JD requirement")
    recommendation: str = Field(..., description="How the candidate can acquire or highlight this skill")

class MatchAnalysisResponse(BaseModel):
    match_score: int = Field(..., ge=0, le=100, description="Overall match percentage from 0 to 100")
    summary: str = Field(..., description="A brief 2-sentence summary of why the score is what it is")
    matched_skills: List[str] = Field(..., description="List of skills that match perfectly")
    missing_skills: List[SkillGap] = Field(..., description="Detailed breakdown of missing skills")
    interview_questions: List[str] = Field(..., description="3 tailored interview questions based on the gaps")

class MatchRequest(BaseModel):
    resume_id: int
    job_id: int

class ChatRequest(BaseModel):
    resume_id: int
    job_id: int
    question: str

class ChatResponse(BaseModel):
    answer: str