-- Apply once to a persistent PostgreSQL database; do not use an ephemeral Render filesystem.
CREATE TABLE IF NOT EXISTS verified_review_purchases (
  order_id text NOT NULL,
  product_id text NOT NULL,
  variant_id text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, product_id)
);
CREATE TABLE IF NOT EXISTS verified_review_invitations (
  token_hash char(64) PRIMARY KEY,
  order_id text NOT NULL,
  product_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id),
  FOREIGN KEY (order_id, product_id)
    REFERENCES verified_review_purchases(order_id, product_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS verified_product_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id text NOT NULL,
  product_id text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) <= 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id),
  FOREIGN KEY (order_id, product_id)
    REFERENCES verified_review_purchases(order_id, product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verified_reviews_public_idx ON verified_product_reviews(product_id, created_at DESC) WHERE status='published';
