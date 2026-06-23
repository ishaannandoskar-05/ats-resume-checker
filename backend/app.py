from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

app = Flask(__name__)
CORS(app)

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

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

ATS_ANALYSIS_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) resume analyzer.
Analyze the resume text provided and return a JSON object ONLY — no markdown, no preamble.

Return exactly this structure:
{
  "score": 0,
  "grade": "<Poor | Needs Work | Good | Excellent>",
  "summary": "<2-sentence overall summary>",
  "pros": ["<pro 1>", "<pro 2>"],
  "cons": ["<con 1>", "<con 2>"],
  "keywords_found": ["<keyword>"],
  "keywords_missing": ["<keyword>"],
  "section_scores": {
    "contact_info": 0,
    "work_experience": 0,
    "education": 0,
    "skills": 0,
    "formatting": 0
  }
}"""

LATEX_OPTIMIZATION_SYSTEM_PROMPT = r"""You are an expert resume writer and LaTeX typesetter specializing in ATS-compliant resumes.

Using the resume content provided, rewrite and restructure it into a complete, compilable LaTeX document that:
1. Uses a clean, single-column layout
2. Uses standard LaTeX packages: geometry, hyperref, enumitem, titlesec, fontenc
3. Includes all standard sections: Contact Info, Summary, Experience, Education, Skills
4. Rewrites bullet points to start with strong action verbs
5. Adds quantifiable achievements where inferable
6. Removes all ATS-unfriendly formatting (tables, text boxes, images)
7. Uses clean \section{} headers
8. Keeps font to a standard serif
9. Outputs ONLY the raw LaTeX code — no explanation, no markdown fences

Begin your response with \documentclass and end with \end{document}"""

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    resume_text = data.get('resumeText', '')
    
    if not resume_text:
        return jsonify({"error": "No resume text provided"}), 400

    try:
        import time
        for attempt in range(4):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"Analyze this resume:\n\n{resume_text}",
                    config=genai.types.GenerateContentConfig(
                        system_instruction=ATS_ANALYSIS_SYSTEM_PROMPT,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                        response_schema=ATSResponse,
                        safety_settings=[
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
                        ]
                    )
                )
                break
            except Exception as api_err:
                if attempt == 3 or ("503" not in str(api_err) and "429" not in str(api_err)):
                    raise api_err
                time.sleep(1.5 ** attempt)
        
        if not response.parsed:
            finish_reason = response.candidates[0].finish_reason.name if response.candidates else "Unknown"
            raise Exception(f"AI response was blocked or incomplete. Finish reason: {finish_reason}")
            
        # Return the natively parsed object from the Gemini SDK to completely bypass JSON decoding issues
        parsed_data = response.parsed
        return jsonify(parsed_data.model_dump())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/optimize', methods=['POST'])
def optimize():
    data = request.json
    resume_text = data.get('resumeText', '')
    
    if not resume_text:
        return jsonify({"error": "No resume text provided"}), 400
        
    try:
        import time
        for attempt in range(4):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"Convert and optimize this resume to ATS-compliant LaTeX:\n\n{resume_text}",
                    config=genai.types.GenerateContentConfig(
                        system_instruction=LATEX_OPTIMIZATION_SYSTEM_PROMPT,
                        max_output_tokens=8192,
                        safety_settings=[
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
                        ]
                    )
                )
                break
            except Exception as api_err:
                if attempt == 3 or ("503" not in str(api_err) and "429" not in str(api_err)):
                    raise api_err
                time.sleep(1.5 ** attempt)
        
        if not response.text:
            finish_reason = response.candidates[0].finish_reason.name if response.candidates else "Unknown"
            raise Exception(f"AI response was blocked or incomplete. Finish reason: {finish_reason}")
            
        latex_code = response.text.strip()
        
        # Strip markdown fences if present
        if "```latex\n" in latex_code:
            latex_code = latex_code.split("```latex\n")[1].split("```")[0].strip()
        elif "```\n" in latex_code:
            latex_code = latex_code.split("```\n")[1].split("```")[0].strip()
        elif latex_code.startswith("```"):
            latex_code = latex_code.split("```")[1].split("```")[0].strip()
            
        return jsonify({"latex": latex_code})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
