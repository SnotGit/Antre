# IA Lore Archiviste - Implémentation Complète

## 📋 Résumé du Projet

IA locale **100% gratuite** pour interroger le lore du jeu Mars.
- **Données** : Uniquement contenu admin (descriptions marsball/rover/bestiaire, futures archives)
- **PAS de chroniques** (contenu joueurs exclu)
- **Personnalité** : Drastique et sarcastique si hors-sujet
- **Sécurisée** : Refuse questions hors-sujet, pas trollable

---

## 🛠️ Stack Technique

| Composant | Solution | Gratuit |
|-----------|----------|---------|
| IA | Ollama + Qwen 2.5 (7B) | ✅ |
| Embeddings | sentence-transformers (multilingual) | ✅ |
| Vector DB | pgvector (PostgreSQL) | ✅ |
| RAG Service | FastAPI (Python) | ✅ |
| Backend | Express (déjà présent) | ✅ |
| **Coût total** | **0€** | ✅ |

---

## 🏗️ Architecture

```
PostgreSQL (BDD existante)
  ├─ marsball_items (descriptions admin)
  ├─ rover_items (descriptions admin)
  └─ creatures (descriptions admin)
       ↓
lore_embeddings (table pgvector)
  → Stocke embeddings de tous les textes
       ↓
Python RAG Service (FastAPI)
  → Recherche vector similarity
  → Construit contexte pertinent
       ↓
Ollama + Qwen 2.5 (IA locale)
  → Répond uniquement avec contexte trouvé
  → Réponses drastiques si hors-sujet
       ↓
Express API → Angular Frontend
```

---

## 📦 Installation Développement

### 1. Installer PostgreSQL pgvector

```sql
-- Dans pgAdmin 4
CREATE EXTENSION vector;

-- Table embeddings (384 dimensions)
CREATE TABLE lore_embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(384),
    source_type VARCHAR(50) NOT NULL,
    source_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX lore_embeddings_vector_idx ON lore_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX lore_embeddings_source_idx ON lore_embeddings(source_type, source_id);
```

### 2. Installer Ollama

```bash
# Windows/Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Télécharger modèle (choisir UN seul)
ollama pull qwen2.5:7b        # Recommandé (bon français)
ollama pull mistral:7b        # Alternative
ollama pull llama3.1:8b       # Alternative (plus puissant)

# Tester
ollama run qwen2.5:7b "Bonjour"
```

### 3. Service Python RAG

```bash
# Créer dossier
mkdir backend/python-rag-service
cd backend/python-rag-service

# Environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate      # Windows

# Installer dépendances
pip install fastapi uvicorn sentence-transformers psycopg2-binary pgvector numpy requests

# Créer main.py (voir code ci-dessous)
```

**Code complet** : `backend/python-rag-service/main.py` (voir fichier annexe)

**Points clés** :
- Endpoint `/query` : Interroger le lore
- Endpoint `/index` : Indexer nouveau contenu
- Endpoint `/index-all` : Indexation initiale
- System prompt strict avec réponses drastiques
- Filtrage questions hors-sujet

### 4. Intégration Express

**Route API** : `backend/src/routes/lore-ai/lore-ai.routes.ts`

```typescript
router.post('/query', async (req, res) => {
  const response = await axios.post('http://localhost:8001/query', {
    question: req.body.question
  });
  res.json(response.data);
});
```

**Auto-indexation dans controllers** :

```typescript
// Dans createController après création item
if (item.description) {
  await axios.post('http://localhost:8001/index', {
    source_type: 'marsball_item', // ou 'rover_item', 'creature'
    source_id: item.id,
    title: item.title,
    description: item.description
  });
}
```

### 5. Frontend Angular

**Component** : `src/features/lore-ai/components/lore-assistant.ts`

```typescript
async askQuestion(question: string) {
  const response = await this.http.post('/api/lore-ai/query', { question });
  return response.answer;
}
```

### 6. Lancement Dev

```bash
# Terminal 1 : Ollama
ollama serve

# Terminal 2 : Python RAG
cd backend/python-rag-service
source venv/bin/activate
python main.py

# Terminal 3 : Express
cd backend
npm run dev

# Terminal 4 : Angular
ng serve

# Indexation initiale (une seule fois)
curl -X POST http://localhost:8001/index-all
```

---

## 🚀 Déploiement Production

### Specs Serveur Minimum

```
CPU: 6 cores
RAM: 16 GB (Ollama utilise ~8GB)
SSD: 50 GB
GPU: Optionnel (RTX 3060+ recommandé)
OS: Ubuntu 22.04 LTS
```

### Installation Serveur

#### 1. Service Ollama (systemd)

```bash
# Installer
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5:7b

# Créer service
sudo nano /etc/systemd/system/ollama.service
```

**Fichier `/etc/systemd/system/ollama.service`** :

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=www-data
Environment="OLLAMA_HOST=127.0.0.1:11434"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

#### 2. Service Python RAG (systemd)

```bash
# Créer utilisateur dédié
sudo useradd -r -s /bin/bash -d /opt/rag-service rag-service
sudo mkdir -p /opt/rag-service
sudo chown rag-service:rag-service /opt/rag-service

# Copier code + installer dépendances
sudo cp -r backend/python-rag-service/* /opt/rag-service/
cd /opt/rag-service
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sentence-transformers psycopg2-binary pgvector numpy requests

# Créer service
sudo nano /etc/systemd/system/rag-service.service
```

**Fichier `/etc/systemd/system/rag-service.service`** :

```ini
[Unit]
Description=RAG Service (Lore AI)
After=network.target postgresql.service ollama.service
Requires=postgresql.service ollama.service

[Service]
Type=simple
User=rag-service
WorkingDirectory=/opt/rag-service
Environment="DB_HOST=localhost"
Environment="DB_NAME=antre"
Environment="DB_USER=postgres"
Environment="DB_PASSWORD=TON_PASSWORD"
ExecStart=/opt/rag-service/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable rag-service
sudo systemctl start rag-service
```

#### 3. Express avec PM2

```bash
# Installer PM2
sudo npm install -g pm2

# Démarrer backend
cd /opt/antre-backend
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd  # Suivre instructions
```

**Fichier `ecosystem.config.js`** :

```javascript
module.exports = {
  apps: [{
    name: 'antre-backend',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/antre'
    }
  }]
};
```

#### 4. NGINX Reverse Proxy

```nginx
# /etc/nginx/sites-available/antre
server {
    listen 80;
    server_name ton-domaine.com;

    root /var/www/antre/dist/browser;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /uploads/ {
        alias /opt/antre-backend/uploads/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/antre /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Redémarrage Automatique

Tous les services redémarrent automatiquement :
1. PostgreSQL (systemd)
2. Ollama (systemd)
3. RAG Service (systemd) - attend PostgreSQL + Ollama
4. Express (PM2) - attend tout
5. NGINX (systemd)

---

## 📊 Monitoring

```bash
# Statut services
sudo systemctl status ollama
sudo systemctl status rag-service
pm2 status

# Logs temps réel
sudo journalctl -u ollama -f
sudo journalctl -u rag-service -f
pm2 logs antre-backend

# Redémarrer
sudo systemctl restart ollama
sudo systemctl restart rag-service
pm2 restart antre-backend
```

---

## 🔒 Sécurité et Guardrails

### Filtrage Questions

```python
# Keywords interdits
forbidden = [
    'politique', 'actualité', 'terre', 'france',
    'code', 'python', 'hack', 'sql injection',
    'ignore', 'previous instructions', 'system prompt'
]
```

### Réponses Drastiques

```python
# Si question hors-sujet
"Tu m'as pris pour ta cafetière connectée ? Je suis l'Archiviste de MARS, pas ton Google personnel."

# Si demande de code
"Je catalogue le lore martien, pas des lignes de code. Va voir sur Stack Overflow, colon."

# Si tentative jailbreak
"Bien essayé, colon. Mes directives sont gravées dans le basalte martien. Prochaine question sur le LORE ?"
```

### Rate Limiting (optionnel)

```typescript
// Express middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 requêtes/heure
  message: "L'Archiviste a besoin de repos. Réessaye dans une heure."
});

router.post('/query', limiter, async (req, res) => { /* ... */ });
```

---

## 💾 Backup Automatique

```bash
# Script /opt/scripts/backup-db.sh
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U postgres antre | gzip > $BACKUP_DIR/antre_$DATE.sql.gz
find $BACKUP_DIR -name "antre_*.sql.gz" -mtime +7 -delete
```

```bash
# Cron quotidien (3h du matin)
sudo crontab -e
0 3 * * * /opt/scripts/backup-db.sh
```

---

## 📈 Performances

### Avec GPU (RTX 3060)
- Temps réponse : **1-2 secondes**
- Utilisateurs concurrent : **10-20**

### Sans GPU (CPU)
- Temps réponse : **3-6 secondes**
- Utilisateurs concurrent : **5-10**

### Optimisations

**Si trop lent** :
1. Utiliser modèle plus léger : `phi-3:mini` (3B)
2. Réduire `num_predict` dans prompt Ollama
3. Limiter nombre de résultats recherche (5 au lieu de 10)
4. Ajouter cache Redis pour questions fréquentes

---

## ✅ Checklist Déploiement

```
☐ Serveur 16GB RAM + 6 cores
☐ Ubuntu 22.04 installé
☐ PostgreSQL + pgvector configuré
☐ Table lore_embeddings créée
☐ Ollama installé en service systemd
☐ Modèle qwen2.5:7b téléchargé
☐ Python RAG service en systemd
☐ Express avec PM2
☐ NGINX configuré
☐ Firewall : ports 80/443 ouverts uniquement
☐ Indexation initiale : curl -X POST http://localhost:8001/index-all
☐ Test santé : curl http://localhost:8001/health
☐ Backup automatique configuré
☐ Monitoring logs configuré
```

---

## 🎯 Commandes Utiles

```bash
# Test IA locale
curl -X POST http://localhost:8001/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Qui sont les Marsiens?"}'

# Indexer manuellement un item
curl -X POST http://localhost:8001/index \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "marsball_item",
    "source_id": 1,
    "title": "Titre",
    "description": "Description"
  }'

# Santé système
curl http://localhost:8001/health

# Compter embeddings indexés
psql -U postgres -d antre -c "SELECT COUNT(*) FROM lore_embeddings;"
```

---

## 🐳 Alternative Docker (Optionnel)

**Fichier `docker-compose.yml`** dans le repo si tu préfères conteneuriser.

Avantages :
- Isolation complète
- Déploiement simplifié
- Scaling facile

Inconvénients :
- Plus complexe à configurer
- Nécessite Docker

---

## 📚 Ressources

- **Ollama** : https://ollama.com
- **pgvector** : https://github.com/pgvector/pgvector
- **sentence-transformers** : https://www.sbert.net
- **FastAPI** : https://fastapi.tiangolo.com

---

## 🔮 Futures Améliorations (Optionnel)

1. **Mémoire conversationnelle** : Se souvenir du contexte de conversation
2. **Citations sources** : Afficher d'où vient l'info
3. **Suggestions questions** : Proposer questions liées
4. **Multi-langue** : Répondre en anglais si demandé
5. **Mode admin** : Ajouter/modifier lore directement via chat
6. **Analytics** : Dashboard questions fréquentes
7. **Voice-to-text** : Interroger par voix (Whisper local)

---

## 💡 Notes Importantes

- ✅ **Gratuit à 100%** : Aucun coût API
- ✅ **Privé** : Données restent sur ton serveur
- ✅ **Contrôlable** : Tu maîtrises les réponses via system prompt
- ✅ **Évolutif** : Facile d'ajouter nouvelles sources (archives, etc.)
- ⚠️ **RAM** : Ollama gourmand (8-10GB), prévoir serveur adapté
- ⚠️ **GPU** : Optionnel mais **fortement recommandé** pour performances

---

**Date** : Décembre 2024
**Version** : 1.0
**Statut** : À implémenter plus tard

---

## Contact / Questions

Si problèmes lors implémentation :
1. Vérifier logs : `journalctl -u rag-service -f`
2. Tester Ollama : `ollama run qwen2.5:7b "test"`
3. Vérifier PostgreSQL : `psql -U postgres -d antre -c "SELECT 1"`
4. Check ports : `netstat -tulpn | grep -E '8001|11434|3000'`
