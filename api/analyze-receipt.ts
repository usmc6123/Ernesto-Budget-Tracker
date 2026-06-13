import { verifyToken, handleError } from './shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // 3. Verify that the environment variable is being passed and read properly
  console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

  try {
    // 1. Verify authenticated user via JWT
    verifyToken(req);

    const { imageData, mimeType } = req.body || {};

    if (!imageData || !mimeType) {
      return res.status(400).json({ error: 'Missing required parameters: imageData or mimeType' });
    }

    // Clean up base64 string if it contains the data IRI scheme prefix
    let cleanBase64 = imageData;
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured' });
    }

    const makeApiCall = async (modelName: string) => {
      console.log(`Sending process request via Gemini model: ${modelName}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                { text: 'Analyze this receipt and return ONLY a raw JSON array, no markdown, no explanation, no backticks. Format: [{"description": "item name", "amount": 9.99, "category": "best matching category", "date": "date from receipt or today"}]. Categories must be chosen from this exact list only: Groceries, Food & Dining, Dining Out, Gas, Auto, Housing, Personal Care, Clothing, Health & Fitness, Shopping, Bills & Utilities, Subscriptions, Tech, Entertainment, Cigars & Leisure, Gifts, Parking, Home & Decor, Business, Education, Vacation, Taxes, Card Payments, Other. If multiple items exist on the receipt return all of them as separate entries. If it is a single total return one entry.' }
              ]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error status ${response.status} from ${modelName}:`, errorText);
        throw new Error(`Gemini API Error (status ${response.status}): ${errorText || 'No detailed message'}`);
      }

      const responseData = await response.json();
      // 2. Add better debugging - log the actual Gemini API response payload to the console
      console.log(`Gemini API Response Data (${modelName}):`, JSON.stringify(responseData, null, 2));

      const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`Gemini API returned an empty or invalid content payload structure for model ${modelName}.`);
      }

      const rawText = text.trim();
      // 4. Wrap JSON.parse in a try/catch and log the raw text response before parsing:
      console.log('Raw Gemini response:', rawText);

      // Strip any markdown backticks or extra text, e.g. ```json ... ```
      let jsonText = rawText;
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      try {
        const items = JSON.parse(jsonText);
        if (!Array.isArray(items)) {
          throw new Error('Response parsed successfully as JSON, but was not an Array format');
        }
        return items;
      } catch (parseError: any) {
        console.error(`Failed to parse Gemini model ${modelName} JSON response:`, parseError);
        // Throw custom error containing rawText so the frontend can display it
        const customErr: any = new Error(parseError.message || 'JSON Parsing Error');
        (customErr as any).rawText = rawText;
        (customErr as any).isParseError = true;
        throw customErr;
      }
    };

    let items;
    try {
      // 6. Try parsing with fast flash model first
      items = await makeApiCall('gemini-1.5-flash');
    } catch (err: any) {
      console.warn('First receipt scan attempt (gemini-1.5-flash) failed. Falling back to gemini-1.5-pro...', err);
      try {
        // Fallback to stable pro model
        items = await makeApiCall('gemini-1.5-pro');
      } catch (proErr: any) {
        console.error('Second attempt (gemini-1.5-pro) failed as well.', proErr);
        
        // 5. Check if it was a JSON parsing error
        if (proErr.isParseError) {
          return res.status(422).json({
            error: `JSON PARSING FAILED: ${proErr.message}`,
            rawText: proErr.rawText,
            details: 'Model returned unstructured text instead of a JSON array.'
          });
        }
        
        if (err.isParseError) {
          return res.status(422).json({
            error: `JSON PARSING FAILED: ${err.message}`,
            rawText: err.rawText,
            details: 'Model returned unstructured text instead of a JSON array.'
          });
        }

        // 1 & 7. Separate API call failure from OCR read inability, make error messages specific
        const errorMessage = proErr.message || String(proErr);
        if (errorMessage.includes('status 400') || errorMessage.includes('status 403') || errorMessage.includes('status 429') || errorMessage.includes('status 500') || errorMessage.includes('API Error')) {
          return res.status(502).json({
            error: `GEMINI API SERVICE ERROR: ${errorMessage}`,
            details: 'The image recognition service returned an error. Please verify API quotas, billing status, or try again later.'
          });
        }

        return res.status(422).json({
          error: `COULD NOT READ RECEIPT: ${errorMessage}`,
          details: 'We tried scanning your receipt with multiple AI models, but they could not parse the receipt content. Please try again with a brighter, higher-definition photo.'
        });
      }
    }

    return res.status(200).json({ items });
  } catch (error) {
    return handleError(res, error);
  }
}
