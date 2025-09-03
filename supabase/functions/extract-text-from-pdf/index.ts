import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF text extraction...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);

    // Check file size limit (10GB)
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > maxSize) {
      throw new Error('حجم الملف كبير جداً. الحد الأقصى هو 10GB');
    }

    // Convert file to base64 for processing
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use OpenAI to analyze PDF content through vision API
    // This is a fallback approach since we can't use PDF parsing libraries directly
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في استخراج النصوص من المستندات. استخرج النص بأكبر دقة ممكنة مع الحفاظ على التنسيق والبنية.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'استخرج كامل النص من هذا المستند مع الحفاظ على التنسيق والتسلسل:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!openAIResponse.ok) {
      // If vision API fails, try a text-based approach
      console.log('Vision API failed, trying text extraction approach...');
      
      const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'أنت مساعد ذكي. سأقوم بإرسال محتوى ملف PDF مُحوّل إلى نص، وأريدك أن تساعد في تنظيفه وتنسيقه.'
            },
            {
              role: 'user',
              content: `لا يمكنني معالجة ملف PDF مباشرة في هذا السياق. يرجى تحويل الملف إلى نص أولاً أو استخدام أداة أخرى لاستخراج النص من PDF.`
            }
          ],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });

      const textResult = await textResponse.json();
      
      return new Response(JSON.stringify({
        success: false,
        error: 'PDF processing requires manual conversion',
        suggestion: textResult.choices[0]?.message?.content || 'Please convert PDF to text first',
        fileName: file.name
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await openAIResponse.json();
    const extractedText = result.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error('No text could be extracted');
    }

    console.log('Text extraction completed successfully');

    return new Response(JSON.stringify({
      success: true,
      extractedText,
      fileName: file.name,
      fileSize: file.size,
      tokensUsed: result.usage?.total_tokens || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-text-from-pdf function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});