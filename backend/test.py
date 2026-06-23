import os
from dotenv import load_dotenv
load_dotenv()
from google import genai
from pydantic import BaseModel

class SectionScores(BaseModel):
    contact_info: int
    work_experience: int
    education: int
    skills: int
    formatting: int

class ATSResponse(BaseModel):
    score: int
    grade: str
    summary: str
    pros: list[str]
    cons: list[str]
    keywords_found: list[str]
    keywords_missing: list[str]
    section_scores: SectionScores

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Analyze this resume:\n\nJohn Doe. Software Engineer. 5 years experience.',
    config=genai.types.GenerateContentConfig(
        response_mime_type='application/json',
        response_schema=ATSResponse
    )
)
print('FINISH REASON:', response.candidates[0].finish_reason)
print('TEXT:', repr(response.text))
print('PARSED:', response.parsed)
