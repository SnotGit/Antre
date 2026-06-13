-- Elena — étage recherche extractive : stockage des vecteurs (nomic-embed-text, 768 dim)
-- Additif. Aucune table métier modifiée. Appliqué via psql / prisma db execute (backup d'abord).

CREATE EXTENSION IF NOT EXISTS vector;

--======= TABLE D'INDEX =======

CREATE TABLE IF NOT EXISTS elena_embeddings (
  id           serial      PRIMARY KEY,
  section      text        NOT NULL,
  item_id      integer     NOT NULL,
  content_hash text        NOT NULL,
  embedding    vector(768) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section, item_id)
);

-- index sémantique (cosinus) pour ORDER BY embedding <=> requête
CREATE INDEX IF NOT EXISTS idx_elena_embeddings_hnsw
  ON elena_embeddings USING hnsw (embedding vector_cosine_ops);

--======= NETTOYAGE AUTOMATIQUE À LA SUPPRESSION D'UN ITEM =======
-- Couvre toutes les portes (item seul, lot, cascade de catégorie) sans brancher les controllers.

CREATE OR REPLACE FUNCTION elena_drop_embedding() RETURNS trigger AS $$
BEGIN
  DELETE FROM elena_embeddings WHERE section = TG_ARGV[0] AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_elena_drop_emb ON marsball_items;
CREATE TRIGGER trg_elena_drop_emb AFTER DELETE ON marsball_items
  FOR EACH ROW EXECUTE FUNCTION elena_drop_embedding('marsball');

DROP TRIGGER IF EXISTS trg_elena_drop_emb ON creatures;
CREATE TRIGGER trg_elena_drop_emb AFTER DELETE ON creatures
  FOR EACH ROW EXECUTE FUNCTION elena_drop_embedding('bestiaire');

DROP TRIGGER IF EXISTS trg_elena_drop_emb ON terraformars_items;
CREATE TRIGGER trg_elena_drop_emb AFTER DELETE ON terraformars_items
  FOR EACH ROW EXECUTE FUNCTION elena_drop_embedding('terraformars');

DROP TRIGGER IF EXISTS trg_elena_drop_emb ON rover_items;
CREATE TRIGGER trg_elena_drop_emb AFTER DELETE ON rover_items
  FOR EACH ROW EXECUTE FUNCTION elena_drop_embedding('rover');
