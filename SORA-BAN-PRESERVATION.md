# Préservation intégrale de SORA BAN BOT

## Garantie de conservation
- Ne pas supprimer ni déplacer le dossier source `$HOME/SORA-BAN-BOT/Tristinus`.
- Ne pas écraser les fichiers existants dans l'archive : le script `tools/archive-sora-ban.sh` utilise une copie non destructive.
- Le code Telegram original `main.py` et `requirements.txt` restent dans le dépôt à leurs chemins actuels.
- Le nouveau moteur WhatsApp est séparé dans `index.js` et `package.json`.

## Copier tous les fichiers originaux dans Termux
Depuis le dépôt cloné, exécuter :
```bash
bash tools/archive-sora-ban.sh "$HOME/SORA-BAN-BOT/Tristinus" "$HOME/DRACULA-NOSFERA-WHATSAPP"
```
Le dossier `SORA-BAN-ORIGINAL-ARCHIVE` est une copie locale complète, sans écrasement. Si des fichiers ont déjà été archivés, ils ne sont pas remplacés automatiquement.

## Confidentialité
L'archive complète peut contenir des jetons, sessions, bases de données, proxys, courriels ou autres données privées. Elle reste ignorée par Git afin d'éviter leur publication. Cela ne supprime pas ces fichiers de l'appareil. Les fichiers sources non sensibles peuvent ensuite être ajoutés séparément au dépôt après vérification.

## Fonctionnalités héritées
Le code source reste conservé même si une fonction n'est pas transposable à WhatsApp. Telegram et WhatsApp utilisent des protocoles différents. Les paiements fictifs, les résultats aléatoires et les simulations de bannissement/signalement ne sont pas des actions réelles. Le bot WhatsApp ne doit pas prétendre effectuer ces actions.
