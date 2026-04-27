# services/embedder.py
# SINGLE RESPONSIBILITY: ONLY converts text → vectors (embeddings)
# No PDF parsing, no ranking, no AI explanation. Just text → numbers.

from sentence_transformers import SentenceTransformer
import numpy as np

class Embedder:
    """
    Converts text into vector embeddings using Sentence Transformers.
    
    Why 'all-MiniLM-L6-v2'?
    - Free, no API key needed
    - Fast (runs on CPU fine)
    - 384 dimensions — good balance of quality vs speed
    - Downloads once (~80MB), cached forever after
    """
    
    # Class variable — model loads ONCE when first Embedder is created
    # Not every time we call encode(). That would be too slow.
    _model = None
    
    def __init__(self):
        # Lazy loading — only download model when first needed
        if Embedder._model is None:
            print("Loading Sentence Transformer model... (first time only)")
            Embedder._model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Model loaded successfully!")
        self.model = Embedder._model
    
    def encode_single(self, text: str) -> np.ndarray:
        """
        Convert one text string into a vector.
        Used for: Job Description embedding
        
        Returns: numpy array of shape (384,)
        """
        # normalize_embeddings=True → makes cosine similarity = dot product
        # This improves ranking accuracy
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding
    
    def encode_batch(self, texts: list) -> np.ndarray:
        """
        Convert multiple texts into vectors efficiently.
        Used for: Encoding all resumes at once (faster than one by one)
        
        Returns: numpy array of shape (num_resumes, 384)
        """
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=True,   # shows progress in terminal
            batch_size=32             # process 32 texts at a time
        )
        return embeddings