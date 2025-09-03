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
    console.log('Starting video transcription...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing video file: ${file.name}, size: ${file.size} bytes`);

    // Check file size limit (10GB - but note Whisper API has 25MB limit for direct processing)
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    const whisperMaxSize = 25 * 1024 * 1024; // 25MB for Whisper API
    
    if (file.size > maxSize) {
      throw new Error('حجم الملف كبير جداً. الحد الأقصى هو 10GB');
    }
    
    // For files larger than Whisper limit, we'll need to implement chunking or compression
    if (file.size > whisperMaxSize) {
      console.log(`File size ${file.size} exceeds Whisper limit, will attempt processing anyway`);
    }

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', file);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'ar'); // Arabic language preference
    whisperFormData.append('response_format', 'json');
    whisperFormData.append('timestamp_granularities[]', 'segment');

    console.log('Sending to Whisper API...');

    // Call OpenAI Whisper API for transcription
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error('Whisper API error:', error);
      throw new Error(`Whisper API error: ${error}`);
    }

    const transcriptionResult = await whisperResponse.json();
    const transcribedText = transcriptionResult.text;

    if (!transcribedText || transcribedText.trim().length === 0) {
      throw new Error('No speech detected in the audio/video file');
    }

    console.log('Transcription completed successfully');

    // Enhance transcription with GPT for better formatting and Arabic support
    const enhanceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'أنت خبير في تحسين النصوص المنسوخة من الصوت. قم بتحسين النص وإصلاح أي أخطاء في التشكيل أو الترقيم مع الحفاظ على المعنى الأصلي.'
          },
          {
            role: 'user',
            content: `حسّن النص المنسوخ التالي وأصلح أي أخطاء في الإملاء والترقيم:\n\n${transcribedText}`
          }
        ],
        max_tokens: 2500,
        temperature: 0.3,
      }),
    });

    let enhancedText = transcribedText;
    
    if (enhanceResponse.ok) {
      const enhanceResult = await enhanceResponse.json();
      enhancedText = enhanceResult.choices[0]?.message?.content || transcribedText;
      console.log('Text enhancement completed');
    } else {
      console.log('Text enhancement failed, using original transcription');
    }

    return new Response(JSON.stringify({
      success: true,
      transcribedText: enhancedText,
      originalTranscription: transcribedText,
      fileName: file.name,
      fileSize: file.size,
      duration: transcriptionResult.duration || 0,
      language: transcriptionResult.language || 'unknown',
      segments: transcriptionResult.segments || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in transcribe-video function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});