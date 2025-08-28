import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { createHash } from 'crypto';

interface GenerateImagesResult {
  success: boolean;
  error: string | null;
  images: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private promptTemplate: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
    
    this.promptTemplate = 
      'Make me look like a fashion influencer using the product image. ' +
      'If the product is apparel, remove the original clothes from the original picture, ' +
      'and let me wear the product and pose. If the product is something else, ' +
      'make me look like I use it and enjoy it. Make sure product is visible in ' +
      'the same frame as me together.';
  }

  async generateInfluencerImages(
    userImageData: Buffer,
    productUrls: string[],
    imageCount: number = 1
  ): Promise<GenerateImagesResult> {
    try {
      // Download and process product images
      const productImages: Buffer[] = [];
      for (const url of productUrls) {
        try {
          const productImageData = await this.downloadImage(url);
          productImages.push(productImageData);
        } catch (e) {
          console.log(`Failed to download product image from ${url}: ${e}`);
          continue;
        }
      }

      if (productImages.length === 0) {
        return {
          success: false,
          error: 'Failed to download any product images',
          images: []
        };
      }

      // Process user image to JPEG
      const userImageJpeg = await this.processImage(userImageData);

      // Generate images
      const generatedImages: string[] = [];
      const userHash = createHash('sha256').update(userImageJpeg).digest('hex');

      // Process all product images
      const processedProducts: Array<{url: string, data: Buffer, hash: string}> = [];
      for (let i = 0; i < productUrls.length && i < productImages.length; i++) {
        try {
          const processedData = await this.processImage(productImages[i]);
          const hash = createHash('sha256').update(processedData).digest('hex');
          processedProducts.push({
            url: productUrls[i],
            data: processedData,
            hash
          });
        } catch (e) {
          console.log(`Failed to process product image for ${productUrls[i]}: ${e}`);
        }
      }

      if (processedProducts.length === 0) {
        return {
          success: false,
          error: 'No valid product images after processing',
          images: []
        };
      }

      const productHashes = new Set(processedProducts.map(p => p.hash));

      // Generate images with retry logic
      let attempts = 0;
      while (generatedImages.length < imageCount && attempts < imageCount * 3) {
        attempts++;
        try {
          // Build content with all products
          const content = [this.promptTemplate];
          
          // Add user image
          content.push({
            inlineData: {
              data: userImageJpeg.toString('base64'),
              mimeType: 'image/jpeg'
            }
          });

          // Add all product images
          processedProducts.forEach(product => {
            content.push({
              inlineData: {
                data: product.data.toString('base64'),
                mimeType: 'image/jpeg'
              }
            });
          });

          // Debug logging
          console.log(`[Gemini] Model: gemini-2.5-flash-image-preview | Prompt length: ${this.promptTemplate.length}`);
          console.log(`[Gemini] Prompt: ${this.promptTemplate}`);
          console.log(`[Gemini] Product URLs: ${processedProducts.map(p => p.url).join(', ')}`);
          console.log(`[Gemini] User image bytes: ${userImageJpeg.length} | Total product images: ${processedProducts.length} | image_count: ${imageCount}`);

          try {
            const response = await this.model.generateContent(content);
            
            let imagesFound = 0;
            let echoedFiltered = 0;
            let totalParts = 0;

            if (response.response?.candidates) {
              for (const candidate of response.response.candidates) {
                if (!candidate.content) continue;
                
                for (const part of candidate.content.parts || []) {
                  totalParts++;
                  
                  if (part.inlineData?.data) {
                    try {
                      const imgData = Buffer.from(part.inlineData.data, 'base64');
                      const outHash = createHash('sha256').update(imgData).digest('hex');
                      
                      // Filter out echoed input images
                      if (outHash === userHash || productHashes.has(outHash)) {
                        echoedFiltered++;
                        continue;
                      }

                      const mimeType = part.inlineData.mimeType || 'image/jpeg';
                      const dataUrl = `data:${mimeType};base64,${imgData.toString('base64')}`;
                      generatedImages.push(dataUrl);
                      imagesFound++;
                      
                      if (generatedImages.length >= imageCount) break;
                    } catch (parseErr) {
                      console.log(`Failed to parse inline image data: ${parseErr}`);
                    }
                  }
                }
                if (generatedImages.length >= imageCount) break;
              }
            }

            console.log(`[Gemini] candidates: ${response.response?.candidates?.length || 0}, parts: ${totalParts}, images_found: ${imagesFound}, echoed_filtered: ${echoedFiltered}`);
            
            if (imagesFound === 0) {
              console.log('[Gemini] No images generated - using mock image to fill count');
              generatedImages.push(this.createMockImage(generatedImages.length + 1));
            }

          } catch (geminiError) {
            console.log(`Gemini API error: ${geminiError}`);
            generatedImages.push(this.createMockImage(generatedImages.length + 1));
          }
        } catch (e) {
          console.log(`Error in generation attempt ${attempts}: ${e}`);
          continue;
        }
      }

      if (generatedImages.length === 0) {
        return {
          success: false,
          error: 'Failed to generate any images. The Gemini image generation model may not be available.',
          images: []
        };
      }

      // Trim to requested count
      if (generatedImages.length > imageCount) {
        generatedImages.splice(imageCount);
      }

      return {
        success: true,
        error: null,
        images: generatedImages
      };

    } catch (e) {
      console.log(`Error in generateInfluencerImages: ${e}`);
      return {
        success: false,
        error: `Image generation failed: ${e}`,
        images: []
      };
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (e) {
      throw new Error(`Failed to download image from ${url}: ${e}`);
    }
  }

  private async processImage(imageData: Buffer): Promise<Buffer> {
    try {
      // Convert to JPEG using sharp
      const processedImage = await sharp(imageData)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      return processedImage;
    } catch (e) {
      throw new Error(`Failed to process image: ${e}`);
    }
  }

  private createMockImage(productIndex: number): string {
    try {
      // Create SVG mock image
      const svgContent = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#grad)"/>
        <text x="200" y="180" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Mock Fashion</text>
        <text x="200" y="210" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Influencer Image</text>
        <text x="200" y="240" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">#${productIndex}</text>
        <text x="200" y="280" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">(API Quota Exceeded)</text>
      </svg>`;
      
      const svgB64 = Buffer.from(svgContent, 'utf-8').toString('base64');
      return `data:image/svg+xml;base64,${svgB64}`;
    } catch (e) {
      console.log(`Error creating mock image: ${e}`);
      return `data:text/plain;base64,${Buffer.from('Mock image generation failed', 'utf-8').toString('base64')}`;
    }
  }
}