-- Correção de segurança: adicionar SET search_path = public
-- Risco: ZERO (função não é usada no código atual)

CREATE OR REPLACE FUNCTION public.insert_image_usage(
  p_user_id UUID,
  p_model_name TEXT,
  p_prompt TEXT,
  p_cost NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.token_usage (
    user_id,
    model_name,
    message_content,
    ai_response_content,
    tokens_used,
    input_tokens,
    output_tokens,
    created_at
  ) VALUES (
    p_user_id,
    p_model_name,
    p_prompt,
    'Image generated successfully',
    1,
    1,
    1,
    NOW()
  );
END;
$$;