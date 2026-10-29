# DRACULA NOSFERA — port WhatsApp

## Préservation du projet
Les fichiers Telegram hérités, dont `main.py`, `requirements.txt`, les bases de données et les sauvegardes déjà présentes, sont conservés. Le nouveau moteur WhatsApp est ajouté séparément dans `index.js`; il ne remplace pas le code source SORA BAN BOT.

## Lancer dans Termux
1. Installer Node.js 20+.
2. Copier `.env.example` vers `.env` et renseigner éventuellement `PHONE_NUMBER`.
3. Exécuter `npm install`, puis `npm start`.
4. Si `PHONE_NUMBER` est vide, scanner le QR affiché. Sinon, utiliser le code d'appairage affiché quand la socket est prête.

Ne publiez jamais `.env`, `sessions/`, des jetons ou des identifiants.

## Compatibilité et limites
Le code Telegram original et ses données sont conservés en tant qu'archive de référence, mais ses commandes ne deviennent pas automatiquement des commandes WhatsApp. Les API Telegram, les paiements fictifs, les contrôles simulés et les fonctions de bannissement/signalement ne sont pas des capacités réelles de WhatsApp. Le moteur WhatsApp expose des commandes locales de base et ne prétend pas vérifier l'état d'un compte WhatsApp ni effectuer des signalements de masse.

Cette première version doit être testée dans Termux avec la version de Node.js et de Baileys installée. Aucune promesse de zéro bug n'est possible sans exécution et vérification sur l'appareil.
