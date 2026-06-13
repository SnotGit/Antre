-- Elena — journal des recherches (le « rockyou » de la biblio).
-- Affine la couche de code (cache/alias), jamais le modèle d'embedding (figé).
-- Additif. Requêtable et dédupliqué (terme normalisé en clé).

CREATE TABLE IF NOT EXISTS elena_searches (
  term         text        PRIMARY KEY,
  raw_sample   text        NOT NULL,
  hits         integer     NOT NULL DEFAULT 1,
  found        boolean     NOT NULL,
  result_count integer     NOT NULL DEFAULT 0,
  last_seen    timestamptz NOT NULL DEFAULT now()
);

-- les requêtes à zéro résultat = l'or du log (alias à créer, contenu à produire)
CREATE INDEX IF NOT EXISTS idx_elena_searches_not_found
  ON elena_searches (hits DESC) WHERE found = false;
