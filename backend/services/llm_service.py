# services/llm_service.py
# Handles all LLM API communication for the Resume Ranker.

import json
import os
from pathlib import Path
from urllib import error, request

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class LLMService:
    """
    Handles all OpenRouter API calls for the Resume Ranker.

    The rest of the app keeps calling LLMService, so we can swap providers
    without changing route logic.
    """

    def __init__(self):
        api_key = os.getenv("OPENROUTER_API_KEY")

        if not api_key:
            raise ValueError("OPENROUTER_API_KEY not found in .env file!")

        self.api_key = api_key
        self.model_name = os.getenv("OPENROUTER_MODEL", "openrouter/free").strip()
        self.base_url = os.getenv(
            "OPENROUTER_BASE_URL",
            "https://openrouter.ai/api/v1/chat/completions",
        ).strip()
        self.app_name = os.getenv("OPENROUTER_APP_NAME", "AI Resume Ranker").strip()
        self.app_url = os.getenv(
            "OPENROUTER_APP_URL",
            "http://localhost:8000",
        ).strip()
        self.timeout_seconds = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "20"))
        self.analysis_jd_chars = int(os.getenv("OPENROUTER_ANALYSIS_JD_CHARS", "1200"))
        self.analysis_resume_chars = int(os.getenv("OPENROUTER_ANALYSIS_RESUME_CHARS", "1200"))
        self.questions_jd_chars = int(os.getenv("OPENROUTER_QUESTIONS_JD_CHARS", "700"))
        self.questions_resume_chars = int(os.getenv("OPENROUTER_QUESTIONS_RESUME_CHARS", "700"))

        print(f"OpenRouter LLM Service initialized. Model: {self.model_name}")

    def analyze_candidate(
        self,
        job_description: str,
        resume_text: str,
        match_percentage: float,
    ) -> dict:
        prompt = f"""
You are an expert technical recruiter. Analyze this candidate's fit for the role.

JOB DESCRIPTION:
{job_description[:self.analysis_jd_chars]}

CANDIDATE RESUME:
{resume_text[:self.analysis_resume_chars]}

SEMANTIC MATCH SCORE: {match_percentage}%

Respond with ONLY a valid JSON object. No markdown, no explanation, just JSON.
Use exactly this structure:

{{
    "matched_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "missing_skills": ["skill1", "skill2", "skill3"],
    "experience_alignment": "One sentence about how well experience level matches the role",
    "verdict": "STRONG MATCH",
    "verdict_reason": "One sentence explaining the verdict",
    "ats_score": 75,
    "interview_recommendation": true,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
}}

Rules:
- matched_skills: top 5 skills from resume that match JD
- missing_skills: top 3 critical skills in JD not found in resume
- verdict: must be exactly one of: "STRONG MATCH", "GOOD MATCH", "WEAK MATCH"
- ats_score: number between 0-100 based on overall fit, but keep it broadly aligned with the semantic match score
- if semantic match is below 50, ats_score should usually stay below 60 unless there is unusually strong direct relevance
- if semantic match is between 50 and 70, ats_score should usually stay between 55 and 78
- if semantic match is above 70, ats_score can be 70 or higher
- interview_recommendation: true if ats_score >= 60, false otherwise
- Return ONLY the JSON. No extra text.
"""

        try:
            raw_text = self._chat_completion(prompt)
            analysis = json.loads(self._extract_json_text(raw_text))
            analysis["llm_success"] = True
            analysis["llm_error"] = None
            analysis["llm_model"] = self.model_name
            return analysis
        except json.JSONDecodeError as e:
            print(f"OpenRouter JSON parse error: {e}")
            return self._fallback_analysis(
                match_percentage,
                f"Invalid JSON from OpenRouter: {e}",
            )
        except Exception as e:
            print(f"OpenRouter API error: {e}")
            return self._fallback_analysis(match_percentage, str(e))

    def generate_interview_questions(self, job_description: str, resume_text: str) -> list:
        prompt = f"""
Based on this job description and candidate resume, generate 5 targeted interview questions.

JOB DESCRIPTION: {job_description[:self.questions_jd_chars]}
RESUME: {resume_text[:self.questions_resume_chars]}

Return ONLY a JSON array of 5 strings. Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]

No markdown, no explanation, just the JSON array.
"""

        try:
            raw_text = self._chat_completion(prompt)
            questions = json.loads(self._extract_json_text(raw_text))
            return questions if isinstance(questions, list) else []
        except Exception as e:
            print(f"Interview questions generation failed: {e}")
            return [
                "Tell me about your most challenging project?",
                "How do you approach debugging complex issues?",
                "Describe your experience with the tech stack in this role?",
                "How do you stay updated with new technologies?",
                "Where do you see yourself in 2 years?",
            ]

    def _chat_completion(self, prompt: str) -> str:
        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a precise recruiting assistant that returns clean JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        body = json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.app_url,
            "X-Title": self.app_name,
        }

        req = request.Request(
            self.base_url,
            data=body,
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as resp:
                response_json = json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as e:
            response_text = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code}: {response_text}") from e
        except error.URLError as e:
            raise RuntimeError(f"Network error calling OpenRouter: {e.reason}") from e

        choices = response_json.get("choices") or []
        if not choices:
            raise RuntimeError(f"OpenRouter returned no choices: {response_json}")

        message = choices[0].get("message", {})
        content = message.get("content", "")

        if isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text_parts.append(item.get("text", ""))
            content = "\n".join(part for part in text_parts if part).strip()

        if not isinstance(content, str) or not content.strip():
            raise RuntimeError(f"OpenRouter returned empty content: {response_json}")

        return content.strip()

    def _extract_json_text(self, raw_text: str) -> str:
        raw_text = raw_text.strip()

        if raw_text.startswith("```"):
            segments = raw_text.split("```")
            if len(segments) >= 2:
                raw_text = segments[1].strip()
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()

        start_obj = raw_text.find("{")
        end_obj = raw_text.rfind("}")
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            return raw_text[start_obj:end_obj + 1]

        start_arr = raw_text.find("[")
        end_arr = raw_text.rfind("]")
        if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
            return raw_text[start_arr:end_arr + 1]

        return raw_text

    def get_ats_breakdown(self, job_description: str, resume_text: str) -> dict:
        """
        Detailed ATS score breakdown - weighted scoring per category.

        Called separately from /rank, mainly for shortlisted candidates.
        """

        prompt = f"""
You are an expert ATS (Applicant Tracking System) analyzer.
Score this resume against the job description across 4 weighted categories.

JOB DESCRIPTION:
{job_description[:1200]}

RESUME:
{resume_text[:1200]}

Return ONLY a valid JSON object with exactly this structure:

{{
    "overall_ats_score": 72,
    "breakdown": {{
        "skills_match": {{
            "score": 80,
            "weight": 40,
            "weighted_score": 32,
            "found": ["Python", "FastAPI", "AWS"],
            "missing": ["Docker", "Kubernetes"]
        }},
        "experience_match": {{
            "score": 70,
            "weight": 30,
            "weighted_score": 21,
            "comment": "2 years relevant experience, role needs 3+"
        }},
        "education_match": {{
            "score": 90,
            "weight": 20,
            "weighted_score": 18,
            "comment": "B.Tech CSE matches requirement"
        }},
        "keyword_density": {{
            "score": 55,
            "weight": 10,
            "weighted_score": 5.5,
            "important_keywords_found": ["machine learning", "REST API"],
            "important_keywords_missing": ["deep learning", "MLOps"]
        }}
    }},
    "shortlist_recommendation": true,
    "shortlist_reason": "One sentence - why shortlist or not",
    "top_3_improvements": [
        "Add Docker and container experience",
        "Quantify ML project impact with metrics",
        "Mention specific AWS services used"
    ],
    "resume_sections_check": {{
        "has_summary": true,
        "has_skills": true,
        "has_experience": true,
        "has_education": true,
        "has_projects": true,
        "has_certifications": true
    }}
}}

Rules:
- overall_ats_score = sum of all weighted_scores (must match math)
- skills_match weight=40, experience_match weight=30, education_match weight=20, keyword_density weight=10
- weighted_score = (score/100) * weight for each category
- shortlist_recommendation: true if overall_ats_score >= 60
- has_experience: true if resume has internships, jobs, work experience, OR professional roles
- has_projects: true if resume mentions any named project OR describes building/developing/creating anything
- has_certifications: true if resume mentions any certificate, certification, course, or credential
- Return ONLY the JSON. No markdown, no explanation.
"""

        try:
            raw_text = self._chat_completion(prompt)
            breakdown = json.loads(self._extract_json_text(raw_text))
            breakdown["llm_success"] = True
            return breakdown
        except json.JSONDecodeError as e:
            print(f"ATS breakdown JSON parse error: {e}")
            return self._fallback_ats_breakdown()
        except Exception as e:
            print(f"ATS breakdown API error: {e}")
            return self._fallback_ats_breakdown()

    def _fallback_ats_breakdown(self) -> dict:
        """Fallback when ATS breakdown fails."""
        return {
            "overall_ats_score": 0,
            "breakdown": {
                "skills_match": {
                    "score": 0,
                    "weight": 40,
                    "weighted_score": 0,
                    "found": [],
                    "missing": [],
                },
                "experience_match": {
                    "score": 0,
                    "weight": 30,
                    "weighted_score": 0,
                    "comment": "Analysis unavailable",
                },
                "education_match": {
                    "score": 0,
                    "weight": 20,
                    "weighted_score": 0,
                    "comment": "Analysis unavailable",
                },
                "keyword_density": {
                    "score": 0,
                    "weight": 10,
                    "weighted_score": 0,
                    "important_keywords_found": [],
                    "important_keywords_missing": [],
                },
            },
            "shortlist_recommendation": False,
            "shortlist_reason": "Analysis unavailable - please try again",
            "top_3_improvements": ["Please try again"],
            "resume_sections_check": {
                "has_summary": False,
                "has_skills": False,
                "has_experience": False,
                "has_education": False,
                "has_projects": False,
                "has_certifications": False,
            },
            "llm_success": False,
        }

    def _fallback_analysis(self, match_percentage: float, error_message: str | None = None) -> dict:
        verdict = (
            "STRONG MATCH" if match_percentage >= 70
            else "GOOD MATCH" if match_percentage >= 50
            else "WEAK MATCH"
        )

        return {
            "matched_skills": ["Analysis unavailable"],
            "missing_skills": ["Analysis unavailable"],
            "experience_alignment": "Could not analyze - please try again",
            "verdict": verdict,
            "verdict_reason": f"Based on {match_percentage}% semantic similarity score",
            "ats_score": int(match_percentage),
            "interview_recommendation": match_percentage >= 60,
            "strengths": ["See resume for details"],
            "improvements": ["See JD for requirements"],
            "llm_success": False,
            "llm_error": error_message,
            "llm_model": self.model_name,
        }
