#!/data/data/com.termux/files/usr/bin/bash
set -eu

PROJECT="$HOME/DRACULA-NOSFERA-WHATSAPP"
cd "$PROJECT"

echo "=========================================="
echo "      DRACULA NOSFERA - INSTALLATION"
echo "=========================================="

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js absent : installation via pkg..."
  pkg update -y
  pkg install nodejs-lts git -y
fi

echo
echo "Node : $(node --version)"
echo "npm  : $(npm --version)"
echo

if [ ! -f package.json ] || [ ! -f index.js ]; then
  echo "Erreur : package.json ou index.js introuvable."
  exit 1
fi

# Crée la configuration uniquement si elle n'existe pas.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Fichier .env créé depuis .env.example."
else
  echo "Fichier .env déjà présent : conservé sans modification."
fi

mkdir -p sessions bot_data
npm install

echo
echo "Installation terminée."
echo "Configure PHONE_NUMBER dans .env pour le code d'appairage."
echo "Laisse PHONE_NUMBER vide pour utiliser le QR code."
echo "Démarrage : npm start"
