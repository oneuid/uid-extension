# UID Link (Extension de navigateur) - Français

**UID Link** est une extension multi-navigateur haute performance conçue pour l'écosystème d'identité souveraine **UID.ONE**. Elle agit comme l'agent de sécurité au niveau du navigateur, appliquant des politiques Zero-Trust, de DLP (prévention des pertes de données) contextuelle et de liaison de session cryptographique en temps réel directement du côté client.

---

## 🛡️ Fonctionnalités du moteur de sécurité

### 1. Liaison de session cryptographique
Prévient le détournement de session et le vol de jetons. Une fois authentifié, UID Link verrouille la session en :
* Générant une empreinte numérique de l'appareil matériel local.
* Créant une signature liée par HMAC pour le `sessionToken` actif.
* Enregistrant la liaison de manière sécurisée auprès de l'API backend `/v1/auth/session-binding/register/`.
* Vérifiant la signature localement avant d'autoriser des requêtes privilégiées.

### 2. Vérification d'origine (Bouclier anti-hameçonnage)
Contrôle activement les domaines visités pour détecter l'usurpation d'identité, le typosquatting et les tentatives d'hameçonnage ciblant la marque UID.one :
* Fait correspondre les variations de domaine telles que `uid-one-login.com`, `uidone-secure.com`, et `uid.one.evil.com` via des expressions régulières.
* Injecte automatiquement une bannière rouge d'avertissement faisant autorité si une fausse page est détectée, empêchant l'utilisateur de saisir ses identifiants.

### 3. Prévention des pertes de données au niveau du navigateur (DLP)
Inspecte les actions côté client pour empêcher les fuites involontaires d'informations personnelles (PII), d'identifiants ou de documents sensibles :
* **Mode Présentation (Presentation Mode) :** Activez via `Alt+Shift+P` pour flouter dynamiquement et masquer tous les motifs de texte brut sensibles (numéros de téléphone, e-mails, cartes d'identité, numéros de carte de crédit) sur les pages web. Survolez avec la souris (hover) pour afficher temporairement.
* **Intercepteur d'importation de fichiers :** Écoute les événements d'importation de fichiers (input et drag & drop). Les fichiers sont analysés côté client, bloquant les fichiers dangereux avec une superposition d'avertissement.
* **Intercepteur de presse-papiers :** Intercepte les copier/coller. Bloque les collages suspects à l'aide de modales de confirmation et notifie lors de la copie de données sensibles.
* **Intercepteur de formulaires :** Analyse la conformité des formulaires avant que les données ne quittent le contexte du navigateur.

### 4. Cookie Guard & Anti-Tracking
Protège la vie privée de l'utilisateur même lorsqu'il clique sur "Tout accepter" sur les bannières de consentement aux cookies :
* Intercepte l'écriture de `document.cookie` pour bloquer l'enregistrement de cookies de suivi/publicitaires (ex : `_ga`, `_gid`, `_fbp`, `_fbc`, `hj*`, `cluid`).
* Détecte et bloque les cookies contenant des données personnelles sensibles (e-mails, cartes de crédit, JWT et clés API).
* Nettoie périodiquement (toutes les 5 secondes) les cookies de suivi définis via les en-têtes HTTP de réponse.

### 5. Dynamic EXIF & Metadata Stripper
Supprime automatiquement les métadonnées de localisation et d'appareil des images téléchargées :
* Intercepte les téléchargements d'images (JPEG/JPG) via les entrées de fichiers ou le glisser-déposer.
* Supprime les coordonnées GPS, le modèle de l'appareil photo et l'horodatage de création (segment APP1) côté client avant la soumission.

### 6. OTP auto-destructeur / Effacement du cache d'entrée
Empêche les fuites d'identifiants sensibles ou de codes OTP dans des environnements partagés ou compromis :
* Détecte les champs d'OTP, de 2FA, de mots de passe et de cartes de crédit lors des soumissions de formulaires.
* Efface automatiquement les valeurs des champs et supprime l'historique de saisie automatique du navigateur 300 ms après la soumission.
* Vide immédiatement le presse-papiers s'il contient des valeurs personnelles sensibles.

### 7. Global Privacy Control (GPC) & DNT
Affirme le droit souverain de l'utilisateur à la vie privée :
* Injecte les signaux de confidentialité standard (`navigator.globalPrivacyControl = true` et `navigator.doNotTrack = '1'`) dans le contexte global de toutes les pages web.

### 8. Nettoyeur de Viewport & Protection
* **Bloqueur de notifications :** Intercepte l'enregistrement de service worker et les autorisations de notification pour bloquer les notifications intrusives.
* **Nettoyeur de Viewport :** Masque les éléments flottants suspects et les keyloggers potentiels sur les pages sécurisées.
* **Floutage de focus (Tab Focus Blurring) :** Floute automatiquement la page uniquement lorsque l'onglet est masqué (`document.hidden`), protégeant ainsi l'écran des regards indiscrets.

---

## 🚀 Comment installer

Choisissez l'une des deux méthodes simples ci-dessous pour installer l'extension :

### Option 1 : Installer la version précompilée (Recommandé & Plus simple)
1. Téléchargez **`uid-link-chrome.zip`** (pour Chrome, Edge, Brave) ou **`uid-link-firefox.zip`** (pour Firefox) à la racine de ce dépôt.
2. Extrayez le fichier zip téléchargé dans un dossier sur votre ordinateur.
3. Ouvrez votre navigateur et accédez à `chrome://extensions/` (ou `about:debugging` dans Firefox).
4. Activez le **"Mode développeur"** dans le coin supérieur droit.
5. Cliquez sur **"Charger l'extension non empaquetée"** et sélectionnez le dossier extrait.

---

### Option 2 : Cloner et compiler depuis les sources
1. Clonez ce dépôt sur votre ordinateur :
   ```bash
   git clone https://github.com/oneuid/uid-extension.git
   cd uid-extension
   ```
2. Installez les dépendances et compilez :
   ```bash
   npm install
   npm run build
   ```
3. Ouvrez `chrome://extensions/`, activez le **"Mode développeur"**, cliquez sur **"Charger l'extension non empaquetée"** et sélectionnez le dossier compilé **`dist/chrome/`**.

---

## 📂 Configuration de Native Messaging

Pour vérifier les fonctionnalités d'intégration avec l'OS (telles que les contrôles de sécurité matériels), assurez-vous que le manifeste de l'hôte de messagerie native est installé dans le répertoire système correspondant :

* **Linux :** `~/.config/google-chrome/NativeMessagingHosts/`
* **macOS :** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
* **Windows :** Clé de registre `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`

---

## 📄 Licence

Ce projet est sous licence [Licence Source-Available UID.ONE](LICENSE).

En rendant notre code source visible, nous assurons une totale transparence quant à l'application de vos politiques de sécurité. Sous cette licence :
* Vous pouvez auditer et exécuter le logiciel localement pour vérification personnelle de sécurité.
* La redistribution commerciale par des tiers, la publication sur des magasins d'extensions publics et les forks commerciaux sont strictement interdits.
* Les clients B2B autorisés de UID.ONE sont entièrement autorisés à utiliser le logiciel dans leurs opérations quotidiennes.
