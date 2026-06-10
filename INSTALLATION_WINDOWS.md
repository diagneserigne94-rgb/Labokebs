# 📋 GUIDE D'INSTALLATION — LaboKeb
## Logiciel de Gestion du Laboratoire d'Analyses Médicales
### District Sanitaire de Kébémer

---

## PRÉREQUIS

Avant de commencer, télécharger et installer les logiciels suivants :

### 1. Node.js (v18 ou supérieur)
- Lien : https://nodejs.org/fr/download/
- Choisir : **Windows Installer (.msi) — LTS**
- Installer avec les options par défaut
- Vérification : ouvrir l'invite de commandes → taper `node -v`

### 2. PostgreSQL (v15 ou supérieur)
- Lien : https://www.postgresql.org/download/windows/
- Choisir : **Windows x86-64**
- Lors de l'installation :
  - Mot de passe superutilisateur : mémoriser ce mot de passe (ex. `postgres`)
  - Port : **5432** (par défaut)
  - Locale : **French, France**
- Installer pgAdmin 4 (inclus) pour gérer la base de données

### 3. Git (optionnel)
- Lien : https://git-scm.com/download/win
- Permet de mettre à jour le logiciel facilement

---

## ÉTAPE 1 — PRÉPARER LA BASE DE DONNÉES

### 1.1 Ouvrir pgAdmin 4
- Chercher « pgAdmin 4 » dans le menu Démarrer
- Se connecter avec le mot de passe PostgreSQL défini lors de l'installation

### 1.2 Créer la base de données
1. Clic droit sur **Servers → PostgreSQL → Databases**
2. Cliquer **Create → Database...**
3. Nom : `labokeb`
4. Owner : `postgres`
5. Cliquer **Save**

### 1.3 Exécuter les scripts SQL
1. Clic droit sur la base `labokeb` → **Query Tool**
2. Ouvrir le fichier `database/schema.sql` (Fichier → Ouvrir)
3. Cliquer ▶ **Exécuter** (F5)
4. Ouvrir ensuite `database/seed.sql` et l'exécuter de même

---

## ÉTAPE 2 — CONFIGURER LE BACKEND

### 2.1 Ouvrir l'invite de commandes
- Appuyer sur `Windows + R`, taper `cmd`, appuyer sur Entrée

### 2.2 Aller dans le dossier backend
```
cd C:\labokeb\backend
```
*(adapter le chemin selon l'emplacement du dossier)*

### 2.3 Installer les dépendances
```
npm install
```
*(Attendre la fin de l'installation — environ 1 à 2 minutes)*

### 2.4 Configurer le fichier d'environnement
- Ouvrir le fichier `backend\.env` avec le Bloc-notes
- Modifier les valeurs suivantes :

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=labokeb
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRESQL
JWT_SECRET=labokeb_secret_key_2024_kebemer
PORT=3001
BACKUP_DIR=C:/labokeb/sauvegardes
```

**Important :** remplacer `VOTRE_MOT_DE_PASSE_POSTGRESQL` par le mot de passe défini lors de l'installation de PostgreSQL.

### 2.5 Créer le dossier de sauvegardes
```
mkdir C:\labokeb\sauvegardes
```

---

## ÉTAPE 3 — CONFIGURER LE FRONTEND

### 3.1 Aller dans le dossier frontend
```
cd C:\labokeb\frontend
```

### 3.2 Installer les dépendances
```
npm install
```

### 3.3 Configurer l'URL du backend
- Ouvrir `frontend\.env` avec le Bloc-notes
- Vérifier :
```
VITE_API_URL=http://localhost:3001/api
```

### 3.4 Construire l'application (pour production)
```
npm run build
```
*(Génère le dossier `dist/` avec l'application optimisée)*

---

## ÉTAPE 4 — DÉMARRER LE LOGICIEL

### 4.1 Démarrer le serveur backend
Dans l'invite de commandes (dossier `backend`) :
```
npm start
```
Vous devriez voir : `✅ Serveur démarré sur le port 3001`

### 4.2 Démarrer le frontend (mode développement)
Dans une **nouvelle** invite de commandes (dossier `frontend`) :
```
npm run dev
```
Vous verrez : `➜ Local: http://localhost:5173/`

### 4.3 Accéder au logiciel
- Ouvrir le navigateur (Google Chrome ou Firefox recommandé)
- Aller à l'adresse : **http://localhost:5173**

---

## ÉTAPE 5 — PREMIÈRE CONNEXION

### Comptes par défaut
| Identifiant     | Mot de passe | Rôle           |
|-----------------|--------------|----------------|
| `admin`         | `Admin@2024` | Administrateur |
| `technicien`    | `Admin@2024` | Technicien     |
| `receptionniste`| `Admin@2024` | Réceptionniste |

⚠️ **Changer immédiatement les mots de passe** après la première connexion !

---

## ÉTAPE 6 — UTILISATION EN RÉSEAU LOCAL

Pour que plusieurs ordinateurs du réseau local accèdent au logiciel :

### Sur le serveur (l'ordinateur principal)
1. Trouver l'adresse IP du serveur : ouvrir `cmd` → taper `ipconfig`
   - Note l'adresse IPv4, ex. `192.168.1.10`

### Sur les autres ordinateurs
- Ouvrir le navigateur
- Aller à : `http://192.168.1.10:5173`

### Modifier la configuration CORS (si nécessaire)
Dans `backend/src/server.js`, ajouter l'IP du réseau :
```javascript
origin: ['http://localhost:5173', 'http://192.168.1.10:5173']
```

---

## DÉMARRAGE AUTOMATIQUE AU LANCEMENT DE WINDOWS

Pour démarrer LaboKeb automatiquement :

### Méthode 1 — Script batch
Créer un fichier `demarrer_labokeb.bat` sur le Bureau :
```batch
@echo off
echo Démarrage de LaboKeb...
start "LaboKeb Backend" cmd /k "cd /d C:\labokeb\backend && npm start"
timeout /t 3
start "LaboKeb Frontend" cmd /k "cd /d C:\labokeb\frontend && npm run dev"
timeout /t 3
start chrome http://localhost:5173
```

### Méthode 2 — Démarrage Windows
1. Appuyer sur `Windows + R` → taper `shell:startup`
2. Copier le fichier `.bat` dans ce dossier

---

## SAUVEGARDE DES DONNÉES

### Sauvegarde automatique
- Le logiciel effectue une sauvegarde automatique chaque soir à **23h00**
- Les fichiers sont sauvegardés dans `C:\labokeb\sauvegardes\`

### Sauvegarde manuelle
- Aller dans **Administration → Sauvegarde**
- Cliquer **Lancer une sauvegarde**

### Copier les sauvegardes sur clé USB
Copier régulièrement le contenu de `C:\labokeb\sauvegardes\` sur une clé USB.

---

## RÉSOLUTION DES PROBLÈMES COURANTS

### Le logiciel ne démarre pas
1. Vérifier que PostgreSQL est démarré :
   - Ouvrir pgAdmin 4 et se connecter
   - Ou : Panneau de configuration → Services → PostgreSQL → Démarrer

2. Vérifier que le port 3001 n'est pas bloqué :
   - Panneau de configuration → Pare-feu Windows → Autoriser une application

### Message « Erreur de connexion à la base de données »
- Vérifier le fichier `.env` : mot de passe PostgreSQL correct ?
- Vérifier que la base `labokeb` existe dans pgAdmin

### Page blanche dans le navigateur
- Vider le cache du navigateur (Ctrl+Shift+R)
- Vérifier que le frontend est bien démarré (`npm run dev`)

### Mot de passe oublié
Dans pgAdmin → Query Tool sur la base `labokeb` :
```sql
UPDATE utilisateurs
SET mot_de_passe = '$2b$10$rOvHf9Pt8vBZ9l3RLB/TKehYjfHYvBz4Q8TrSmKqt7JVqKFLQFOAO'
WHERE username = 'admin';
```
*(Remet le mot de passe à `Admin@2024`)*

---

## INFORMATIONS SYSTÈME

- **Logiciel :** LaboKeb v1.0
- **Établissement :** District Sanitaire de Kébémer
- **Contact technique :** districtkebemer2022@gmail.com
- **Technologies :** React 18, Node.js 18, PostgreSQL 15, Express 4

---

*Guide rédigé pour le Laboratoire d'Analyses Médicales du District Sanitaire de Kébémer*
*Quartier Escale — BP 30 — Tél : 78 059 20 94 / 76 784 86 32 55*
