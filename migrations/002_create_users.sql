CREATE TABLE IF NOT EXISTS users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username varchar(80) NOT NULL UNIQUE CHECK (length(trim(username)) > 0),
  password_hash varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
