# main.py
# FastAPI entry point

from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel

from services.embedder import Embedder
from services.llm_service import LLMService
from services.pdf_parser import extract_text_from_multiple_pdfs, extract_text_from_pdf
from services.ranker import ResumeRanker


load_dotenv(Path(__file__).resolve().parent / ".env")


app = FastAPI(
    title="AI Resume Ranker",
    description="Rank resumes against job descriptions using RAG + AI",
    version="1.0.0",
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Swagger UI can misrender multi-file arrays when OpenAPI 3.1 uses
    # `contentMediaType` instead of the older `format: binary`.
    for schema in openapi_schema.get("components", {}).get("schemas", {}).values():
        properties = schema.get("properties", {})
        for prop in properties.values():
            if prop.get("type") == "string" and "contentMediaType" in prop:
                prop["format"] = "binary"
                prop.pop("contentMediaType", None)

            items = prop.get("items")
            if (
                prop.get("type") == "array"
                and isinstance(items, dict)
                and items.get("type") == "string"
                and "contentMediaType" in items
            ):
                items["format"] = "binary"
                items.pop("contentMediaType", None)

    openapi_schema["openapi"] = "3.0.3"
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

#CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://resume-ranker-gules.vercel.app"  # Your exact Vercel URL here!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


embedder = Embedder()
ranker = ResumeRanker()
llm_service = LLMService()


class RankRequest(BaseModel):
    job_description: str


# ROUTE 1: Health check
@app.get("/")
def home():
    return {
        "status": "running",
        "message": "AI Resume Ranker API is live",
        "version": "1.0.0",
    }


# ROUTE 2: Test single PDF parsing
@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """
    Test route - upload one PDF and get back extracted text.
    """

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    pdf_bytes = await file.read()
    result = extract_text_from_pdf(pdf_bytes, file.filename)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {result['error']}")

    return {
        "message": "PDF parsed successfully",
        "filename": result["filename"],
        "page_count": result["page_count"],
        "char_count": result["char_count"],
        "text_preview": result["text"][:500],
        "full_text_length": len(result["text"]),
    }


# ROUTE 3: Upload and parse multiple resumes
@app.post("/upload-resumes")
async def upload_resumes(
    files: Annotated[
        list[UploadFile],
        File(..., description="Upload multiple PDF resumes"),
    ]
):
    """
    Upload multiple resume PDFs at once.
    """

    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF")

    pdf_data = []
    for file in files:
        pdf_bytes = await file.read()
        pdf_data.append((pdf_bytes, file.filename))

    results = extract_text_from_multiple_pdfs(pdf_data)
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]

    return {
        "message": f"Processed {len(files)} resumes",
        "successful": len(successful),
        "failed": len(failed),
        "resumes": [
            {
                "filename": r["filename"],
                "page_count": r["page_count"],
                "char_count": r["char_count"],
                "text_preview": r["text"][:300],
            }
            for r in successful
        ],
        "errors": [
            {"filename": r["filename"], "error": r["error"]}
            for r in failed
        ],
    }


# ROUTE 4: Rank resumes with embeddings
@app.post("/rank")
async def rank_resumes(
    job_description: Annotated[
        str,
        Form(..., description="Paste the Job Description here"),
    ],
    resumes: Annotated[
        list[UploadFile],
        File(..., description="Upload PDF resumes to rank"),
    ]
):
    """
    Upload JD text + resume PDFs and return ranked results.

    Step 1: Parse all PDFs -> extract text
    Step 2: Embed all resume texts -> vectors
    Step 3: Embed JD -> vector
    Step 4: FAISS finds closest resume vectors to JD vector
    Step 5: Return ranked list (AI explanations come in Phase 4)
    """

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")

    if not resumes:
        raise HTTPException(status_code=400, detail="Upload at least one resume")

    resume_texts = []
    resume_filenames = []

    for resume_file in resumes:
        if not resume_file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{resume_file.filename} is not a PDF")

        pdf_bytes = await resume_file.read()
        result = extract_text_from_pdf(pdf_bytes, resume_file.filename)

        if result["success"] and result["text"].strip():
            resume_texts.append(result["text"])
            resume_filenames.append(result["filename"])

    if not resume_texts:
        raise HTTPException(status_code=400, detail="Could not extract text from any resume")

    print(f"Embedding {len(resume_texts)} resumes...")
    resume_embeddings = embedder.encode_batch(resume_texts)

    print("Embedding job description...")
    jd_embedding = embedder.encode_single(job_description)

    ranker.reset()
    ranker.add_resumes(resume_embeddings, resume_texts, resume_filenames)
    results = ranker.rank(jd_embedding, top_k=len(resume_texts))

    return {
        "message": f"Ranked {len(results)} resumes",
        "job_description_preview": job_description[:200],
        "total_resumes": len(results),
        "rankings": [
            {
                "rank": r["rank"],
                "filename": r["filename"],
                "match_percentage": r["match_percentage"],
                "similarity_score": r["similarity_score"],
                "text_preview": r["text_preview"],
            }
            for r in results
        ],
    }


# ROUTE 5: Rank resumes with AI analysis
@app.post("/rank-with-ai")
async def rank_with_ai(
    job_description: Annotated[
        str,
        Form(..., description="Paste the full Job Description here"),
    ],
    resumes: Annotated[
        list[UploadFile],
        File(..., description="Upload PDF resumes to rank and analyze"),
    ]
):
    """
    Full RAG pipeline - ranking + AI explanation per candidate.

    This is the complete flow:
    RETRIEVE -> FAISS finds top matching resumes
    AUGMENT -> Pack JD + resume text together as model context
    GENERATE -> AI explains match, skills, verdict, and ATS score
    """

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")

    if not resumes:
        raise HTTPException(status_code=400, detail="Upload at least one resume")

    resume_texts = []
    resume_filenames = []

    for resume_file in resumes:
        if not resume_file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{resume_file.filename} is not a PDF")

        pdf_bytes = await resume_file.read()
        result = extract_text_from_pdf(pdf_bytes, resume_file.filename)

        if result["success"] and result["text"].strip():
            resume_texts.append(result["text"])
            resume_filenames.append(result["filename"])

    if not resume_texts:
        raise HTTPException(status_code=400, detail="Could not extract text from any resume")

    print(f"Embedding {len(resume_texts)} resumes...")
    resume_embeddings = embedder.encode_batch(resume_texts)
    jd_embedding = embedder.encode_single(job_description)

    ranker.reset()
    ranker.add_resumes(resume_embeddings, resume_texts, resume_filenames)
    ranked_results = ranker.rank(jd_embedding, top_k=len(resume_texts))

    print(f"Sending {len(ranked_results)} resumes to AI for analysis...")

    final_results = []
    for result in ranked_results:
        print(f"Analyzing {result['filename']} with AI...")

        ai_analysis = llm_service.analyze_candidate(
            job_description=job_description,
            resume_text=result["text"],
            match_percentage=result["match_percentage"],
        )

        final_results.append({
            "rank": result["rank"],
            "filename": result["filename"],
            "match_percentage": result["match_percentage"],
            "similarity_score": result["similarity_score"],
            "ats_score": ai_analysis.get("ats_score", 0),
            "verdict": ai_analysis.get("verdict", "UNKNOWN"),
            "verdict_reason": ai_analysis.get("verdict_reason", ""),
            "matched_skills": ai_analysis.get("matched_skills", []),
            "missing_skills": ai_analysis.get("missing_skills", []),
            "experience_alignment": ai_analysis.get("experience_alignment", ""),
            "interview_recommendation": ai_analysis.get("interview_recommendation", False),
            "strengths": ai_analysis.get("strengths", []),
            "improvements": ai_analysis.get("improvements", []),
            "llm_success": ai_analysis.get("llm_success", False),
            "llm_error": ai_analysis.get("llm_error"),
            "llm_model": ai_analysis.get("llm_model"),
            "text_preview": result["text_preview"],
        })

    return {
        "message": f"RAG analysis complete for {len(final_results)} resumes",
        "job_description_preview": job_description[:200],
        "total_resumes": len(final_results),
        "pipeline": "PDF -> Text -> Embeddings -> FAISS -> AI -> Results",
        "rankings": final_results,
    }


# ROUTE 6: Generate interview questions
@app.post("/interview-questions")
async def get_interview_questions(
    job_description: str = Form(...),
    resume: UploadFile = File(...),
):
    """
    Generate 5 custom interview questions for a specific candidate.
    """

    pdf_bytes = await resume.read()
    result = extract_text_from_pdf(pdf_bytes, resume.filename)

    if not result["success"]:
        raise HTTPException(status_code=500, detail="Could not parse resume")

    questions = llm_service.generate_interview_questions(
        job_description=job_description,
        resume_text=result["text"],
    )

    return {
        "filename": resume.filename,
        "interview_questions": questions,
    }
# ROUTE 7: Detailed ATS breakdown
@app.post("/ats-analysis")
async def ats_analysis(
    job_description: str = Form(...),
    resume: UploadFile = File(...),
):
    """
    Detailed ATS score breakdown for a single resume.
    
    Use this AFTER /rank to deep-dive into a shortlisted candidate.
    Gives weighted scoring across skills, experience, education, keywords.
    
    Real ATS systems like Greenhouse and Lever work exactly like this -
    they break the score into weighted categories, not just one number.
    """
    
    if not resume.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    pdf_bytes = await resume.read()
    result = extract_text_from_pdf(pdf_bytes, resume.filename)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail="Could not parse resume")
    
    print(f"Running ATS breakdown for {resume.filename}...")
    breakdown = llm_service.get_ats_breakdown(
        job_description=job_description,
        resume_text=result["text"],
    )
    
    return {
        "filename": resume.filename,
        "job_description_preview": job_description[:200],
        "ats_breakdown": breakdown,
    }
