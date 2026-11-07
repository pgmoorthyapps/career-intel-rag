from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role_id: int = 1 # Default is Candidate (1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse