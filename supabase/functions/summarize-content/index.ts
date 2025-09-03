import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting summarization request...');
    
    const { text, summaryType, fileName, fileType, userId } = await req.json();

    if (!text || !summaryType || !fileName || !userId) {
      throw new Error('Missing required fields: text, summaryType, fileName, userId');
    }

    console.log(`Processing ${summaryType} summary for file: ${fileName}`);

    // Create summary record with pending status
    const { data: summaryRecord, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        original_file_name: fileName,
        file_type: fileType || 'text',
        content_type: 'text',
        original_content: text.substring(0, 50000), // Limit for storage
        summary_type: summaryType,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to create summary record');
    }

    console.log('Summary record created:', summaryRecord.id);

    // Prepare OpenAI prompt based on summary type
    let systemPrompt = '';
    let userPrompt = '';

    switch (summaryType) {
      case 'basic':
        systemPrompt = 'أنت خبير في تلخيص المحتوى. قم بإنشاء ملخص موجز ومفيد باللغة العربية.';
        userPrompt = `قم بتلخيص النص التالي في نقاط واضحة ومختصرة:\n\n${text}`;
        break;
      
      case 'detailed':
        systemPrompt = 'أنت خبير في التحليل والتلخيص المفصل. قم بإنشاء تحليل شامل ومفصل باللغة العربية.';
        userPrompt = `قم بتحليل وتلخيص النص التالي بشكل مفصل مع تقسيمه إلى أقسام وتضمين النقاط الرئيسية والفرعية:\n\n${text}`;
        break;
      
      case 'keypoints':
        systemPrompt = 'أنت خبير في استخراج النقاط المهمة. قم بتحديد أهم النقاط باللغة العربية.';
        userPrompt = `استخرج أهم النقاط والمفاهيم الرئيسية من النص التالي بتنسيق نقاط واضح:\n\n${text}`;
        break;
      
      case 'mindmap':
        systemPrompt = 'أنت خبير في تنظيم المعلومات وإنشاء الخرائط الذهنية. قم بتنظيم المحتوى بشكل هرمي باللغة العربية.';
        userPrompt = `قم بتنظيم النص التالي على شكل خريطة ذهنية هرمية مع العناوين الرئيسية والفرعية:\n\n${text}`;
        break;
      
      default:
        throw new Error('Invalid summary type');
    }

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await openAIResponse.json();
    const summaryText = result.choices[0]?.message?.content;

    if (!summaryText) {
      throw new Error('No summary generated');
    }

    console.log('Summary generated successfully');

    // Update summary record with result
    const { error: updateError } = await supabase
      .from('summaries')
      .update({
        summary_text: summaryText,
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        metadata: {
          model_used: 'gpt-4o-mini',
          tokens_used: result.usage?.total_tokens || 0,
          processing_time: Date.now() - new Date(summaryRecord.created_at).getTime()
        }
      })
      .eq('id', summaryRecord.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update summary record');
    }

    console.log('Summary process completed successfully');

    return new Response(JSON.stringify({
      success: true,
      summaryId: summaryRecord.id,
      summary: summaryText,
      fileName,
      summaryType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in summarize-content function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});