require('dotenv').config();

const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BOT_NAME = process.env.BOT_NAME || 'DRACULA NOSFERA';
const CREATOR = process.env.CREATOR || 'MADO';
const PREFIX = process.env.PREFIX || '.';
const PHONE_NUMBER = (process.env.PHONE_NUMBER || '').replace(/\D/g, '');
const OWNER_NUMBER = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');
const AUTH_DIR = path.join(__dirname, 'sessions');
const DATA_DIR = path.join(__dirname, 'bot_data');
const DB_PATH = path.join(DATA_DIR, 'whatsapp-data.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function readDb() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { startedAt: new Date().toISOString(), messages: 0, users: [], groupBans: {} }; }
}
function writeDb(db) {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function menu() {
  return [
    '╔════════════════════════════╗',
    '║       🧛 DRACULA NOSFERA   ║',
    '╚════════════════════════════╝',
    '',
    '┏━━━〔 ⚙️ GÉNÉRAL 〕',
    '┃ .menu',
    '┃ .help',
    '┃ .ping',
    '┃ .alive',
    '┃ .info',
    '┃ .time',
    '┃ .calc 12+8',
    '┃ .number +2250700000000',
    '┃ .id',
    '┃ .encode texte',
    '┃ .decode BASE64',
    '┃ .hash texte',
    '┃ .passgen 20',
    '┃ .uuid',
    '┃ .random 1 100',
    '┃ .reverse texte',
    '┃ .upper texte / .lower texte',
    '┃ .count texte',
    '┃ .date',
    '┃ .stats',
    '┃ .uptime',
    '┃ .appeal',
    '┃ .check +2250700000000',
    '┃ .premium / .buy / .pay',
    '┃ .proxy_stats',
    '┗━━━━━━━━━━━━━━━━━━━━',
    '',
    'Créateur : ' + CREATOR,
    'Préfixe : ' + PREFIX,
    'WhatsApp • Termux'
  ].join('\n');
}

function safeCalc(expression) {
  const s = String(expression || '').replace(/\s/g, '');
  if (!s || s.length > 60 || !/^[0-9+\-*/().%]+$/.test(s)) return null;
  if (/\*\*|\/\/|[+*/%.\-]{3,}/.test(s)) return null;
  try {
    // Arithmetic-only input is constrained by the whitelist above.
    const result = Function('"use strict"; return (' + s + ')')();
    return Number.isFinite(result) ? String(result) : null;
  } catch { return null; }
}

function numberInfo(input) {
  const raw = String(input || '');
  const normalized = raw.replace(/[\s().-]/g, '');
  if (!/^\+?[1-9]\d{6,14}$/.test(normalized)) {
    return '❌ Format invalide. Utilise le format international, ex. +2250700000000.';
  }
  return '📱 Numéro au format international valide.\n⚠️ Cela ne permet pas de vérifier si le numéro possède WhatsApp ni l’état de son compte.';
}

async function handleMessage(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;

  const text = msg.message.conversation
    || msg.message.extendedTextMessage?.text
    || msg.message.imageMessage?.caption
    || msg.message.videoMessage?.caption
    || '';
  if (!text.startsWith(PREFIX)) return;

  const [rawCommand, ...args] = text.slice(PREFIX.length).trim().split(/\s+/);
  const command = (rawCommand || '').toLowerCase();
  const argText = args.join(' ');
  const sender = jidNormalizedUser(msg.key.participant || msg.key.remoteJid);
  const isOwner = Boolean(OWNER_NUMBER) && sender.split('@')[0].replace(/\D/g, '') === OWNER_NUMBER;

  const db = readDb();
  if (!db.groupBans || typeof db.groupBans !== 'object') db.groupBans = {};
  db.messages = (db.messages || 0) + 1;
  writeDb(db);

  let reply;
  switch (command) {
    case 'menu':
    case 'help':
      reply = menu();
      break;
    case 'ping':
      reply = '🧛 Pong ! DRACULA NOSFERA est actif.';
      break;
    case 'alive':
      reply = '🩸 ' + BOT_NAME + ' est en ligne.\nCréateur : ' + CREATOR;
      break;
    case 'info':
      reply = '🧛 ' + BOT_NAME + '\nVersion : 1.0.0\nCréateur : ' + CREATOR + '\nPréfixe : ' + PREFIX + '\nMoteur : Baileys';
      break;
    case 'time':
      reply = '🕒 ' + new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }) + ' (heure Côte d’Ivoire)';
      break;
    case 'uptime': {
      const seconds = Math.floor(process.uptime());
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      reply = '⏱️ Temps de fonctionnement : ' + hours + ' h ' + minutes + ' min ' + (seconds % 60) + ' s';
      break;
    }
    case 'stats': {
      const dbStats = readDb();
      reply = '📊 STATISTIQUES LOCALES\nMessages traités : ' + (dbStats.messages || 0) +
        '\nDémarrage enregistré : ' + (dbStats.startedAt || 'inconnu') +
        '\nCes chiffres sont locaux à cette installation.';
      break;
    }
    case 'shutdown':
      if (!isOwner) {
        reply = '⛔ Commande réservée au propriétaire. Configure OWNER_NUMBER dans .env.';
        break;
      }
      reply = '🛑 Arrêt demandé par le propriétaire.';
      break;
    case 'calc': {
      const result = safeCalc(argText);
      reply = result === null ? '❌ Calcul non valide. Exemple : .calc 12+8*2' : '🧮 Résultat : ' + result;
      break;
    }
    case 'number':
    case 'numberinfo':
      reply = numberInfo(argText);
      break;
    case 'id':
      reply = '🆔 Identifiant WhatsApp : ' + sender;
      break;
    case 'encode':
      reply = argText ? '🔐 Base64 : ' + Buffer.from(argText, 'utf8').toString('base64') : 'Usage : .encode texte';
      break;
    case 'decode': {
      try {
        if (!args[0] || !/^[A-Za-z0-9+/]*={0,2}$/.test(args[0]) || args[0].length % 4 !== 0) throw new Error('invalid');
        const decoded = Buffer.from(args[0], 'base64').toString('utf8');
        if (!decoded || decoded.includes('\uFFFD')) throw new Error('invalid');
        reply = '🔓 Texte décodé : ' + decoded.slice(0, 3000);
      } catch {
        reply = '❌ Base64 invalide. Exemple : .decode SGVsbG8=';
      }
      break;
    }
    case 'hash':
      reply = argText ? '🔏 SHA-256 : ' + crypto.createHash('sha256').update(argText, 'utf8').digest('hex') : 'Usage : .hash texte';
      break;
    case 'passgen': {
      const requested = Number.parseInt(args[0] || '16', 10);
      const length = Number.isFinite(requested) ? Math.max(8, Math.min(64, requested)) : 16;
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
      const bytes = crypto.randomBytes(length);
      let password = '';
      for (const byte of bytes) password += alphabet[byte % alphabet.length];
      reply = '🔑 Mot de passe généré (' + length + ' caractères) :\n' + password + '\n⚠️ Ne le partage pas dans un groupe.';
      break;
    }
    case 'uuid':
      reply = '🆔 UUID : ' + crypto.randomUUID();
      break;
    case 'random': {
      if (args.length < 2) {
        reply = 'Usage : .random 1 100';
        break;
      }
      const min = Number(args[0]);
      const max = Number(args[1]);
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min || max - min > 1000000000) {
        reply = '❌ Indique deux entiers valides, avec max supérieur ou égal à min.';
        break;
      }
      reply = '🎲 Nombre aléatoire : ' + crypto.randomInt(min, max + 1);
      break;
    }
    case 'reverse':
      reply = argText ? '↩️ ' + Array.from(argText).reverse().join('') : 'Usage : .reverse texte';
      break;
    case 'upper':
      reply = argText ? argText.toLocaleUpperCase('fr-FR') : 'Usage : .upper texte';
      break;
    case 'lower':
      reply = argText ? argText.toLocaleLowerCase('fr-FR') : 'Usage : .lower texte';
      break;
    case 'count':
      reply = argText ? '🔢 Caractères : ' + Array.from(argText).length + '\nMots : ' + (argText.trim() ? argText.trim().split(/\s+/).length : 0) : 'Usage : .count texte';
      break;
    case 'date':
      reply = '📅 ' + new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Abidjan', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      break;
    case 'owner':
      reply = OWNER_NUMBER ? '👑 Créateur : ' + CREATOR + '\nNuméro configuré : +' + OWNER_NUMBER : '👑 Créateur : ' + CREATOR + '\nConfigure OWNER_NUMBER dans .env pour afficher le numéro.';
      break;
    case 'appeal':
      reply = '📝 Je peux aider à préparer un message de recours respectueux. Cette commande ne signale, ne bannit et ne débloque aucun compte WhatsApp.';
      break;
    case 'check': {
      if (!argText) {
        reply = 'Usage : .check +2250700000000\\n⚠️ Démonstration héritée : le statut affiché est aléatoire et ne vérifie pas WhatsApp.';
        break;
      }
      const simulatedStatus = ['ACTIF ✅', 'BANNI ⛔', 'LIMITÉ ⚠️'][crypto.randomInt(0, 3)];
      reply = [
        '╔════════════════════════════╗',
        '     📱 CHECK — SIMULATION',
        '╚════════════════════════════╝',
        '',
        'Numéro : ' + argText,
        'Statut fictif : ' + simulatedStatus,
        'Dernière activité fictive : ' + crypto.randomInt(1, 73) + ' h',
        '',
        '⚠️ Résultat aléatoire de démonstration.',
        'Ce bot ne peut pas vérifier le statut réel du compte WhatsApp.'
      ].join('\\n');
      break;
    }
    case 'ban':
    case 'ban_perm':
    case 'ban_temp':
    case 'unban': {
      if (!jid.endsWith('@g.us')) {
        reply = '⚠️ Cette commande fonctionne uniquement dans un groupe WhatsApp. Elle modère ce groupe, pas le compte WhatsApp dans son ensemble.';
        break;
      }
      const targetInput = args[0] || '';
      const digits = targetInput.replace(/\\D/g, '');
      if (!digits || digits.length < 7 || digits.length > 15) {
        reply = 'Usage : ' + PREFIX + command + ' +2250700000000' + (command === 'ban_temp' ? ' 10m' : '');
        break;
      }
      try {
        const metadata = await sock.groupMetadata(jid);
        const senderId = sender.split('@')[0];
        const senderParticipant = metadata.participants.find(p => (p.id || '').split('@')[0] === senderId);
        const botId = (sock.user?.id || '').split(':')[0].split('@')[0];
        const botParticipant = metadata.participants.find(p => (p.id || '').split('@')[0] === botId);
        const senderIsAdmin = Boolean(senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin'));
        const botIsAdmin = Boolean(botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'));
        if (!isOwner && !senderIsAdmin) {
          reply = '⛔ Seuls le propriétaire configuré ou les administrateurs du groupe peuvent utiliser cette commande.';
          break;
        }
        if (command !== 'unban' && !botIsAdmin) {
          reply = '⛔ Le bot doit être administrateur du groupe pour retirer un membre.';
          break;
        }
        const targetJid = digits + '@s.whatsapp.net';
        const groupBans = readDb().groupBans || {};
        if (command === 'unban') {
          if (groupBans[jid]) delete groupBans[jid][digits];
          const updated = readDb();
          updated.groupBans = groupBans;
          writeDb(updated);
          reply = '🔓 ' + digits + ' retiré de la liste de blocage de ce groupe. Cette commande ne débloque pas un compte WhatsApp globalement et ne réinvite pas la personne.';
          break;
        }
        let expiresAt = null;
        if (command === 'ban_temp') {
          const duration = args[1] || '1h';
          const match = duration.match(/^(\\d{1,5})(m|h|d)$/i);
          if (!match) {
            reply = 'Durée invalide. Exemple : ' + PREFIX + 'ban_temp +2250700000000 10m (m, h ou d).';
            break;
          }
          const amount = Number(match[1]);
          const unit = match[2].toLowerCase();
          const multiplier = unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000;
          const durationMs = amount * multiplier;
          if (amount < 1 || durationMs > 30 * 86400000) {
            reply = 'La durée doit être comprise entre 1 unité et 30 jours maximum.';
            break;
          }
          expiresAt = Date.now() + durationMs;
        }
        const latest = readDb();
        if (!latest.groupBans || typeof latest.groupBans !== 'object') latest.groupBans = {};
        if (!latest.groupBans[jid]) latest.groupBans[jid] = {};
        latest.groupBans[jid][digits] = { expiresAt, by: senderId, createdAt: Date.now() };
        writeDb(latest);
        try {
          await sock.groupParticipantsUpdate(jid, [targetJid], 'remove');
          reply = command === 'ban_temp'
            ? '🛡️ Exclusion temporaire du groupe effectuée pour ' + digits + '. Durée : ' + (args[1] || '1h') + '. Si la personne rejoint à nouveau avant expiration, le bot la retirera tant qu’il reste administrateur.'
            : '🛡️ Exclusion du groupe effectuée pour ' + digits + '. Le blocage est mémorisé pour ce groupe et la personne sera retirée si elle rejoint à nouveau. Cela ne bannit pas son compte WhatsApp globalement.';
        } catch (removeError) {
          const rollback = readDb();
          if (rollback.groupBans?.[jid]) {
            delete rollback.groupBans[jid][digits];
            writeDb(rollback);
          }
          reply = '❌ WhatsApp a refusé l’exclusion. Vérifie que le bot est administrateur et que la cible est un membre de ce groupe.';
        }
      } catch (groupError) {
        reply = '❌ Impossible de vérifier les droits du groupe. Réessaie lorsque la connexion WhatsApp est stable.';
      }
      break;
    }
    case 'mass_report': {
      reply = '⚠️ WhatsApp ne fournit pas à ce bot de commande officielle permettant de lancer des signalements massifs. Aucun signalement n’a été envoyé. Tu peux utiliser les outils de signalement officiels de WhatsApp pour un contenu précis.';
      break;
    }
    case 'premium':
      reply = "🆓 DRACULA NOSFERA — MODE GRATUIT\\n\\nToutes les fonctionnalités gratuites disponibles sont accessibles.\\nAucune offre payante n'est proposée.";
      break;
    case 'buy':
      reply = "🆓 DRACULA NOSFERA est configuré en mode gratuit. Aucun achat n'est nécessaire.";
      break;
    case 'pay':
      reply = "💳 Les paiements sont désactivés. Aucune transaction n'est demandée.";
      break;
    case 'confirm':
      reply = "ℹ️ La confirmation des paiements est désactivée.";
      break;
    case 'pending':
      reply = "ℹ️ Les paiements en attente ne sont plus utilisés.";
      break;
    case 'payment':
      reply = "ℹ️ Les paiements sont désactivés dans cette version.";
      break;
    case 'proxy_stats':
      reply = '🔒 Les statistiques de proxy de la version Telegram ne sont pas disponibles dans ce moteur WhatsApp.';
      break;
    case 'addowner':
    case 'delowner':
    case 'addprem':
    case 'delprem':
    case 'listowners':
    case 'listprem':
    case 'broadcast':
      reply = isOwner
        ? '⚙️ Commande héritée reconnue. La gestion des propriétaires, du premium et la diffusion Telegram ne sont pas restaurées dans ce moteur WhatsApp; aucune modification ni diffusion n’a été effectuée.'
        : '⛔ Commande réservée à l’administrateur. Configure OWNER_NUMBER dans .env.';
      break;
    default:
      reply = '❓ Commande inconnue : ' + PREFIX + command + '\nTape ' + PREFIX + 'menu pour afficher les commandes.';
  }

  await sock.sendMessage(jid, { text: reply }, { quoted: msg });
  if (isOwner && command === 'shutdown') {
    setTimeout(() => process.exit(0), 250);
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version;
  try {
    const result = await fetchLatestBaileysVersion();
    version = result.version;
  } catch (err) {
    console.warn('Impossible de récupérer la version WhatsApp, utilisation de la version par défaut.');
  }

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('DRACULA NOSFERA'),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  if (PHONE_NUMBER && !state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log('\n🔐 CODE D’APPAIRAGE : ' + code + '\n');
        console.log('Entre ce code dans WhatsApp > Appareils connectés > Associer avec un numéro de téléphone.');
      } catch (err) {
        console.error('Impossible de générer le code d’appairage :', err.message || err);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && !PHONE_NUMBER) {
      console.log('\n📲 Scanne ce QR code depuis WhatsApp > Appareils connectés :\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'connecting') console.log('⏳ Connexion à WhatsApp...');
    if (connection === 'open') {
      console.log('✅ ' + BOT_NAME + ' connecté à WhatsApp.');
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = status === DisconnectReason.loggedOut;
      console.error('Connexion fermée. Code :', status || 'inconnu');
      if (loggedOut) {
        console.error('Session déconnectée. Supprime manuellement le dossier sessions uniquement si tu veux recommencer l’association.');
      } else {
        setTimeout(() => startBot().catch(err => console.error('Redémarrage impossible :', err)), 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try { await handleMessage(sock, msg); }
      catch (err) { console.error('Erreur de commande :', err.message || err); }
    }
  });

  sock.ev.on('group-participants.update', async (event) => {
    if (event.action !== 'add' || !event.id) return;
    try {
      const db = readDb();
      const bans = db.groupBans?.[event.id] || {};
      const now = Date.now();
      for (const participant of (event.participants || [])) {
        const digits = (participant || '').split('@')[0].replace(/\\D/g, '');
        const ban = bans[digits];
        if (!ban) continue;
        if (ban.expiresAt && ban.expiresAt <= now) {
          delete bans[digits];
          writeDb(db);
          continue;
        }
        const metadata = await sock.groupMetadata(event.id);
        const botId = (sock.user?.id || '').split(':')[0].split('@')[0];
        const bot = metadata.participants.find(p => (p.id || '').split(':')[0].split('@')[0] === botId);
        if (bot && (bot.admin === 'admin' || bot.admin === 'superadmin')) {
          await sock.groupParticipantsUpdate(event.id, [participant], 'remove');
        }
      }
      writeDb(db);
    } catch (err) {
      console.error('Échec de l’application de la liste de blocage du groupe :', err.message || err);
    }
  });
}

process.on('unhandledRejection', err => console.error('Erreur asynchrone :', err));
process.on('uncaughtException', err => console.error('Erreur interne :', err));

if (require.main === module) {
  startBot().catch(err => {
    console.error('Échec du démarrage :', err);
    process.exitCode = 1;
  });
}

module.exports = { menu, safeCalc, numberInfo };
