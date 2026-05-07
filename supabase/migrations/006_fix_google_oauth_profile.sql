-- Fix: Update handle_new_user to support Google OAuth metadata
-- Google provides: full_name, picture, email, sub (provider)
-- Email signup provides: nickname (from raw_user_meta_data)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, avatar_url, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'nickname',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    -- Google OAuth users are auto-verified
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.raw_user_meta_data->'identities') AS identity WHERE identity->>'provider' = 'google') THEN TRUE
      ELSE FALSE
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
