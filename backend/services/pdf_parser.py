# services/pdf_parser.py
# SINGLE RESPONSIBILITY: This file ONLY extracts text from PDFs

import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_bytes: bytes, filename: str = "resume.pdf") -> dict:
    """
    Extract clean text from a PDF file.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        full_text = ""
        
        # Save page_count BEFORE closing the doc
        page_count = len(doc)
        
        for page_num in range(page_count):
            page = doc[page_num]
            page_text = page.get_text()
            full_text += page_text + "\n"
        
        # Close AFTER we're done reading everything
        doc.close()
        
        # Clean up extra whitespace
        cleaned_text = " ".join(full_text.split())
        
        return {
            "success": True,
            "filename": filename,
            "text": cleaned_text,
            "page_count": page_count,      # ← using saved variable, not doc
            "char_count": len(cleaned_text)
        }
    
    except Exception as e:
        return {
            "success": False,
            "filename": filename,
            "text": "",
            "page_count": 0,
            "error": str(e)
        }


def extract_text_from_multiple_pdfs(pdf_files: list) -> list:
    """
    Extract text from multiple PDFs at once.
    """
    results = []
    for pdf_bytes, filename in pdf_files:
        result = extract_text_from_pdf(pdf_bytes, filename)
        results.append(result)
    return results