CREATE TABLE IF NOT EXISTS phrase_ratings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  phrase_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_phrase FOREIGN KEY(phrase_id) REFERENCES phrases(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_phrase UNIQUE(user_id, phrase_id)
);
