-- Elena — normalisation lexicale côté SQL (miroir de normalizeLexical en JS).
-- Sert au « contient » insensible aux accents/casse sur titres et descriptions.
-- Additif (extension + fonction).

CREATE EXTENSION IF NOT EXISTS unaccent;

-- lower + sans accents + apostrophes/tirets -> espaces + espaces compactés + trim
CREATE OR REPLACE FUNCTION elena_normalize(t text) RETURNS text AS $$
  SELECT btrim(
    regexp_replace(
      regexp_replace(unaccent(lower(coalesce(t, ''))), '[''’\-]', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  );
$$ LANGUAGE sql STABLE;
