# services/embedder.py
# SINGLE RESPONSIBILITY: ONLY converts text → vectors (embeddings)
# Now using Hugging Face Free API to prevent Render 512MB RAM crashes.

import os
import requests
import numpy as np

class Embedder:
    """
    Converts text into vector embeddings using the Hugging Face API.
    
    Why the API?
    - The local SentenceTransformer model is ~80MB but uses >500MB RAM to run.
    - Render free tier limits us to 512MB RAM, causing crashes.
    - This API uses the exact same model ('all-MiniLM-L6-v2') but runs on HF servers.
    - Output is mathematically identical, saving our server memory.
    """
    
    def __init__(self):
        # The exact same model you used locally, just accessed via API
        self.api_url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
        self.hf_token = os.getenv("HF_TOKEN")
        
        if not self.hf_token:
            print("WARNING: HF_TOKEN not found in environment variables! Embeddings will fail.")
            
        self.headers = {"Authorization": f"Bearer {self.hf_token}"}

    def encode_single(self, text: str) -> np.ndarray:
        """
        Convert one text string into a vector.
        Used for: Job Description embedding
        Returns: numpy array of shape (384,)
        """
        try:
            # We send it as a list with one item to keep API format consistent
            response = requests.post(self.api_url, headers=self.headers, json={"inputs": [text]})
            
            if response.status_code == 200:
                # Extract the first item from the returned list of lists
                embedding = np.array(response.json()[0], dtype='float32')
                return embedding
            else:
                print(f"HF API Error (Single): {response.text}")
                # Fallback to zeros so the UI doesn't completely break during a demo
                return np.zeros(384, dtype='float32')
                
        except Exception as e:
            print(f"Embedding generation failed: {e}")
            return np.zeros(384, dtype='float32')

    def encode_batch(self, texts: list) -> np.ndarray:
        """
        Convert multiple texts into vectors efficiently.
        Used for: Encoding all resumes at once.
        Returns: numpy array of shape (num_resumes, 384)
        """
        try:
            response = requests.post(self.api_url, headers=self.headers, json={"inputs": texts})
            
            if response.status_code == 200:
                # Returns a nested list matching the number of resumes
                embeddings = np.array(response.json(), dtype='float32')
                return embeddings
            else:
                print(f"HF API Error (Batch): {response.text}")
                return np.zeros((len(texts), 384), dtype='float32')
                
        except Exception as e:
            print(f"Embedding generation failed: {e}")
            return np.zeros((len(texts), 384), dtype='float32')
