from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
from dotenv import load_dotenv

from api.gemini_service import GeminiService

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Influencer Image Generator",
    description="AI-powered fashion influencer image generation using Google Gemini",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize Gemini service
gemini_service = GeminiService()

@app.get("/")
async def root():
    return {"message": "Fashion Influencer Image Generator API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/generate-images")
async def generate_images(
    user_image: UploadFile = File(...),
    product_urls: str = Form(...),
    image_count: int = Form(default=1)
):
    """
    Generate fashion influencer images by combining user photo with product images.
    
    Args:
        user_image: User's photo file (jpg/png)
        product_urls: Comma-separated product image URLs
        image_count: Number of images to generate (1-4)
    
    Returns:
        JSON response with generated images or error
    """
    try:
        # Validate inputs
        if not user_image.content_type or not user_image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid image file format")
        
        if image_count < 1 or image_count > 4:
            raise HTTPException(status_code=400, detail="Image count must be between 1 and 4")
        
        # Parse product URLs
        urls = [url.strip() for url in product_urls.split(',') if url.strip()]
        if not urls:
            raise HTTPException(status_code=400, detail="At least one product URL is required")
        
        # Read user image
        user_image_data = await user_image.read()
        
        # Generate images using Gemini service
        result = await gemini_service.generate_influencer_images(
            user_image_data=user_image_data,
            product_urls=urls,
            image_count=image_count
        )
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)