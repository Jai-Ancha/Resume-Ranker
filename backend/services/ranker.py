# services/ranker.py
# SINGLE RESPONSIBILITY: ONLY ranks resumes using FAISS vector search
# No PDF parsing, no embedding creation, no AI explanation. Just ranking.

import faiss
import numpy as np
from typing import List, Dict

class ResumeRanker:
    """
    Uses FAISS to find the most similar resumes to a job description.
    
    How FAISS works:
    - You add resume vectors to an "index" (like a searchable database)
    - You give it a JD vector as a query
    - It returns the closest resume vectors (most similar resumes)
    - "Closest" = smallest distance = highest similarity
    """
    
    def __init__(self, dimension: int = 384):
        """
        dimension=384 because all-MiniLM-L6-v2 produces 384-dim vectors
        IndexFlatIP = Flat Index using Inner Product (dot product)
        Since our embeddings are normalized, Inner Product = Cosine Similarity
        """
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # IP = Inner Product
        self.resume_texts = []      # store original texts
        self.resume_filenames = []  # store filenames
    
    def add_resumes(self, embeddings: np.ndarray, texts: List[str], filenames: List[str]):
        """
        Add resume embeddings to FAISS index.
        
        Args:
            embeddings: numpy array of shape (num_resumes, 384)
            texts: list of resume text strings
            filenames: list of PDF filenames
        """
        # FAISS needs float32 specifically
        embeddings_f32 = np.array(embeddings).astype('float32')
        
        # Add to index
        self.index.add(embeddings_f32)
        
        # Store texts and filenames for reference later
        self.resume_texts.extend(texts)
        self.resume_filenames.extend(filenames)
        
        print(f"Added {len(texts)} resumes to index. Total: {self.index.ntotal}")
    
    def rank(self, jd_embedding: np.ndarray, top_k: int = 10) -> List[Dict]:
        """
        Find top_k most similar resumes to the job description.
        
        Args:
            jd_embedding: vector of the job description (shape: 384,)
            top_k: how many top matches to return
        
        Returns:
            List of dicts with rank, filename, score, text
        """
        if self.index.ntotal == 0:
            return []
        
        # Can't return more results than we have resumes
        k = min(top_k, self.index.ntotal)
        
        # Reshape JD embedding for FAISS: needs shape (1, 384) not (384,)
        query = np.array([jd_embedding]).astype('float32')
        
        # FAISS search — returns distances and indices
        # distances = similarity scores (higher = more similar, since we use IP)
        # indices = which resumes matched
        distances, indices = self.index.search(query, k)
        
        results = []
        for rank_pos, (idx, score) in enumerate(zip(indices[0], distances[0])):
            results.append({
                "rank": rank_pos + 1,
                "filename": self.resume_filenames[idx],
                "similarity_score": round(float(score), 4),
                "match_percentage": round(float(score) * 100, 1),
                "text": self.resume_texts[idx],
                "text_preview": self.resume_texts[idx][:400]
            })
        
        return results
    
    def reset(self):
        """Clear the index — used between different ranking sessions"""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.resume_texts = []
        self.resume_filenames = []