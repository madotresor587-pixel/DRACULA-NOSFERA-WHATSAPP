# DRACULA NOSFERA — WhatsApp

Créateur : MADO  
Préfixe : `. ` (le préfixe réel est un point : `.`)  
Runtime : Node.js + Baileys.

## Installation Termux
Depuis le dossier du projet :
```bash
bash termux-install.sh
npm start
```

Le script ne supprime aucun fichier et ne remplace pas un fichier `.env` existant.

## Appairage
- QR code : laisser `PHONE_NUMBER=` vide dans `.env`, lancer `npm start`, puis scanner le QR depuis WhatsApp > Appareils connectés.
- Code d'appairage : renseigner le numéro au format international sans `+`, par exemple `2250700000000`, puis lancer `npm start`.

Ne partage jamais le dossier `sessions/`, le fichier `.env`, les jetons ou les identifiants.

## Commandes actuellement présentes
- `.menu`, `.help`
- `.ping`, `.alive`, `.info`, `.owner`
- `.time`, `.uptime`, `.stats`
- `.calc 12+8*2`
- `.number +2250700000000`, `.numberinfo +2250700000000`
- `.id`
- `.encode texte`, `.decode BASE64`, `.hash texte`
- `.passgen 20` (génère un mot de passe localement)
- `.uuid` — créer un identifiant UUID
- `.random 1 100` — nombre aléatoire dans un intervalle
- `.reverse texte`, `.upper texte`, `.lower texte`
- `.count texte` — compter caractères et mots
- `.date` — date en français, fuseau Côte d’Ivoire
- `.appeal`

Les statistiques sont locales à cette installation. La commande de numéro valide uniquement la forme internationale et ne confirme pas qu'un compte WhatsApp existe.

## Conservation SORA BAN BOT
Le fichier Telegram historique `main.py`, ses dépendances et les autres fichiers déjà présents ne sont pas supprimés. La copie complète locale peut être rangée dans `SORA-BAN-ORIGINAL-ARCHIVE/`. Ne publie pas cette archive complète si elle contient des secrets ou des données personnelles.

Le moteur WhatsApp est un port séparé : les fonctions Telegram ne deviennent pas automatiquement compatibles avec WhatsApp. Les anciennes simulations de bannissement et de signalement ne sont pas des opérations réelles.
