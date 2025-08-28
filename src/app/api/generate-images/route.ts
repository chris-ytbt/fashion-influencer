import { GeminiService } from '@/lib/gemini-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  try {
    // Check for GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      return jsonResponse({ 
        success: false, 
        error: 'Server misconfiguration: GEMINI_API_KEY is not set.' 
      }, 500);
    }

    // Parse form data
    const formData = await req.formData();
    
    const userImageFile = formData.get('user_image') as File;
    const productUrlsString = formData.get('product_urls') as string;
    const imageCountString = formData.get('image_count') as string;

    // Validate inputs
    if (!userImageFile || !userImageFile.type.startsWith('image/')) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid image file format' 
      }, 400);
    }

    const imageCount = parseInt(imageCountString) || 1;
    if (imageCount < 1 || imageCount > 4) {
      return jsonResponse({ 
        success: false, 
        error: 'Image count must be between 1 and 4' 
      }, 400);
    }

    // Parse product URLs
    const productUrls = productUrlsString
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (productUrls.length === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'At least one product URL is required' 
      }, 400);
    }

    // Convert user image to Buffer
    const userImageArrayBuffer = await userImageFile.arrayBuffer();
    const userImageBuffer = Buffer.from(userImageArrayBuffer);

    // Initialize Gemini service and generate images
    const geminiService = new GeminiService();
    const result = await geminiService.generateInfluencerImages(
      userImageBuffer,
      productUrls,
      imageCount
    );

    return jsonResponse(result);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('API Route Error:', message);
    return jsonResponse({ 
      success: false, 
      error: `Internal server error: ${message}` 
    }, 500);
  }
}
