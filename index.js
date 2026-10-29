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
  catch { return { startedAt: new Date().toISOString(), messages: 0, users: [] }; }
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
    case 'calc': {
      const result = safeCalc(argText);
      reply = result === null ? '❌ Calcul non valide. Exemple : .calc 12+8*2' : '🧮 Résultat : ' + result;
      break;
    }
    case 'number':
    case 'numberinfo':
      reply = numberInfo(argText);
      break;
    case 'owner':
      reply = OWNER_NUMBER ? '👑 Créateur : ' + CREATOR + '\nNuméro configuré : +' + OWNER_NUMBER : '👑 Créateur : ' + CREATOR + '\nConfigure OWNER_NUMBER dans .env pour afficher le numéro.';
      break;
    case 'appeal':
      reply = '📝 Je peux aider à préparer un message de recours respectueux. Cette commande ne signale, ne bannit et ne débloque aucun compte WhatsApp.';
      break;
    default:
      reply = '❓ Commande inconnue : ' + PREFIX + command + '\nTape ' + PREFIX + 'menu pour afficher les commandes.';
  }

  await sock.sendMessage(jid, { text: reply }, { quoted: msg });
  if (isOwner && command === 'shutdown') {
    await sock.sendMessage(jid, { text: 'Arrêt demandé par le propriétaire.' }, { quoted: msg });
    process.exit(0);
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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && !PHONE_NUMBER) {
      console.log('\n📲 Scanne ce QR code depuis WhatsApp > Appareils connectés :\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'connecting') console.log('⏳ Connexion à WhatsApp...');
    if (connection === 'open') {
      console.log('✅ ' + BOT_NAME + ' connecté à WhatsApp.');
      if (PHONE_NUMBER && !sock.authState.creds.registered) {
        try {
          const code = await sock.requestPairingCode(PHONE_NUMBER);
          console.log('\n🔐 CODE D’APPAIRAGE : ' + code + '\n');
          console.log('Entre ce code dans WhatsApp > Appareils connectés > Associer avec un numéro de téléphone.');
        } catch (err) {
          console.error('Impossible de générer le code d’appairage :', err.message || err);
        }
      }
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
}

process.on('unhandledRejection', err => console.error('Erreur asynchrone :', err));
process.on('uncaughtException', err => console.error('Erreur interne :', err));

startBot().catch(err => {
  console.error('Échec du démarrage :', err);
  process.exitCode = 1;
});
