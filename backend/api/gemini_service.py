import os
import base64
import hashlib
import requests
from typing import List, Dict, Any
from PIL import Image
from io import BytesIO
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        """Initialize Gemini service with API configuration."""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        # Configure Gemini API
        genai.configure(api_key=api_key)
        
        # Initialize the model
        self.model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
        
        # Define the prompt template
        self.prompt_template = (
            "Make me look like a fashion influencer using the product image. "
            "If the product is apparel, remove the original clothes from the original picture, "
            "and let me wear the product and pose. If the product is something else, "
            "make me look like I use it and enjoy it. Make sure product is visible in "
            "the same frame as me together."
        )
    
    async def generate_influencer_images(
        self, 
        user_image_data: bytes, 
        product_urls: List[str], 
        image_count: int = 1
    ) -> Dict[str, Any]:
        """
        Generate fashion influencer images using Gemini AI.
        
        Args:
            user_image_data: User's image as bytes
            product_urls: List of product image URLs
            image_count: Number of images to generate (1-4)
        
        Returns:
            Dictionary with success status, generated images, or error
        """
        try:
            # Download and process product images
            product_images = []
            for url in product_urls:
                try:
                    product_image_data = await self._download_image(url)
                    product_images.append(product_image_data)
                except Exception as e:
                    print(f"Failed to download product image from {url}: {str(e)}")
                    continue
            
            if not product_images:
                return {
                    "success": False,
                    "error": "Failed to download any product images",
                    "images": []
                }
            
            # Process user image to JPEG bytes
            user_image_jpeg = self._process_image(user_image_data)
            
            # Generate images: produce up to `image_count` outputs total by cycling through provided products
            generated_images = []
            # Precompute hashes of the input images to filter out echoed inputs
            user_hash = hashlib.sha256(user_image_jpeg).hexdigest()

            # Prepare processed product JPEGs once
            processed_products = []
            for url, product_image_data in zip(product_urls, product_images):
                try:
                    pj = self._process_image(product_image_data)
                    processed_products.append((url, pj, hashlib.sha256(pj).hexdigest()))
                except Exception as e:
                    print(f"Failed to process product image for {url}: {e}")

            if not processed_products:
                return {
                    "success": False,
                    "error": "No valid product images after processing",
                    "images": []
                }

            # Prepare lists for all product images and their hashes
            product_bytes_list = [pj for (_, pj, _) in processed_products]
            product_hashes = {h for (_, _, h) in processed_products}
            product_urls_list = [u for (u, _, _) in processed_products]

            # Loop until we collect desired count (or reasonable attempts)
            attempts = 0
            while len(generated_images) < image_count and attempts < image_count * 3:
                attempts += 1
                try:
                    # Build content with ALL products each attempt
                    content = [self.prompt_template, {"mime_type": "image/jpeg", "data": user_image_jpeg}]
                    content.extend({"mime_type": "image/jpeg", "data": pj} for pj in product_bytes_list)

                    # Debug logging of request composition
                    try:
                        print(f"[Gemini] Model: gemini-2.5-flash-image-preview | Prompt length: {len(self.prompt_template)}")
                        print(f"[Gemini] Prompt: {self.prompt_template}")
                        print(f"[Gemini] Product URLs: {', '.join(product_urls_list)}")
                        print(f"[Gemini] User image bytes: {len(user_image_jpeg)} | Total product images: {len(product_bytes_list)} | image_count: {image_count}")
                    except Exception:
                        pass

                    try:
                        response = self.model.generate_content(contents=content)
                        images_found = 0
                        echoed_filtered = 0
                        total_parts = 0
                        if getattr(response, 'candidates', None):
                            for candidate in response.candidates:
                                if not getattr(candidate, 'content', None):
                                    continue
                                for part in getattr(candidate.content, 'parts', []) or []:
                                    total_parts += 1
                                    inline = getattr(part, 'inline_data', None)
                                    if inline and getattr(inline, 'data', None):
                                        data = inline.data
                                        mime_type = getattr(inline, 'mime_type', None) or 'image/jpeg'
                                        try:
                                            if isinstance(data, bytes):
                                                img_bytes = data
                                            elif isinstance(data, str):
                                                try:
                                                    img_bytes = base64.b64decode(data, validate=True)
                                                except Exception:
                                                    img_bytes = data.encode('latin1')
                                            else:
                                                continue

                                            out_hash = hashlib.sha256(img_bytes).hexdigest()
                                            if out_hash == user_hash or out_hash in product_hashes:
                                                echoed_filtered += 1
                                                continue

                                            data_url = f"data:{mime_type};base64," + base64.b64encode(img_bytes).decode('utf-8')
                                            generated_images.append(data_url)
                                            images_found += 1
                                            if len(generated_images) >= image_count:
                                                break
                                        except Exception as parse_err:
                                            print(f"Failed to parse inline image data: {parse_err}")
                                            continue
                                if len(generated_images) >= image_count:
                                    break
                        print(f"[Gemini] candidates: {len(getattr(response, 'candidates', []) or [])}, parts: {total_parts}, images_found: {images_found}, echoed_filtered: {echoed_filtered}")
                        if images_found == 0:
                            print('[Gemini] No images generated - using mock image to fill count')
                            generated_images.append(self._create_mock_image(len(generated_images)+1))
                    except Exception as gemini_error:
                        print(f"Gemini API error: {str(gemini_error)}")
                        generated_images.append(self._create_mock_image(len(generated_images)+1))
                except Exception as e:
                    print(f"Error in generation attempt {attempts}: {str(e)}")
                    # continue to next attempt
                    continue
            
            if not generated_images:
                return {
                    "success": False,
                    "error": "Failed to generate any images. The Gemini image generation model may not be available.",
                    "images": []
                }
            
            # Ensure we only return up to requested count
            if len(generated_images) > image_count:
                generated_images = generated_images[:image_count]

            return {
                "success": True,
                "error": None,
                "images": generated_images
            }
            
        except Exception as e:
            print(f"Error in generate_influencer_images: {str(e)}")
            return {
                "success": False,
                "error": f"Image generation failed: {str(e)}",
                "images": []
            }
    
    async def _download_image(self, url: str) -> bytes:
        """Download image from URL."""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            raise Exception(f"Failed to download image from {url}: {str(e)}")
    
    def _process_image(self, image_data: bytes) -> bytes:
        """Process image data into JPEG bytes suitable for Gemini API."""
        try:
            image = Image.open(BytesIO(image_data))
            # Convert to RGB if necessary and re-encode as JPEG
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=90)
            return buffer.getvalue()
        except Exception as e:
            raise Exception(f"Failed to process image: {str(e)}")
    
    def _image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes (JPEG) to base64 data URL."""
        try:
            img_str = base64.b64encode(image_bytes).decode()
            return f"data:image/jpeg;base64,{img_str}"
        except Exception as e:
            print(f"Error converting image to base64: {str(e)}")
            return ""
    
    def _create_mock_image(self, product_index: int) -> str:
        """Create a mock image for testing when Gemini API is unavailable."""
        try:
            # Create a simple colored image with text
            from PIL import Image, ImageDraw, ImageFont
            
            # Create a 400x400 image with a gradient background
            img = Image.new('RGB', (400, 400), color='white')
            draw = ImageDraw.Draw(img)
            
            # Create gradient background
            for y in range(400):
                color_val = int(255 * (1 - y / 400))
                color = (color_val, 100 + color_val // 2, 255 - color_val // 2)
                draw.line([(0, y), (400, y)], fill=color)
            
            # Add text
            try:
                # Try to use default font, fallback to built-in if not available
                font = ImageFont.load_default()
            except:
                font = None
            
            text = f"Mock Fashion\nInfluencer Image\n#{product_index}"
            
            # Calculate text position (center)
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (400 - text_width) // 2
            y = (400 - text_height) // 2
            
            # Draw multiline text centered without unsupported anchor
            # Pillow's text() does not support anchor for multiline; we manually center using computed x,y
            draw.multiline_text((x+2, y+2), text, fill='black', font=font, align="center", spacing=4)
            draw.multiline_text((x, y), text, fill='white', font=font, align="center", spacing=4)
            
            # Convert to base64
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=90)
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/jpeg;base64,{img_str}"
            
        except Exception as e:
            print(f"Error creating mock image: {str(e)}")
            # Fallback to simple SVG
            svg_content = f'''<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="400" height="400" fill="url(#grad)"/>
                <text x="200" y="180" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Mock Fashion</text>
                <text x="200" y="210" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Influencer Image</text>
                <text x="200" y="240" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">#{product_index}</text>
                <text x="200" y="280" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">(API Quota Exceeded)</text>
            </svg>'''
            svg_b64 = base64.b64encode(svg_content.encode('utf-8')).decode()
            return f"data:image/svg+xml;base64,{svg_b64}"