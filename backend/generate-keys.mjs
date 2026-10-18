// Run locally once. Writes private keys into an ignored local file; prints only the public key.
import {createECDH,randomBytes} from 'node:crypto';
import {writeFileSync,existsSync} from 'node:fs';
const target=new URL('./.push-secrets.env',import.meta.url);if(existsSync(target))throw Error('Keys already exist. Keep existing keys so device subscriptions remain valid.');
const ecdh=createECDH('prime256v1');ecdh.generateKeys();
const publicKey=ecdh.getPublicKey().toString('base64url');
writeFileSync(target,`ST_VAPID_PUBLIC_KEY=${publicKey}\nST_VAPID_PRIVATE_KEY=${ecdh.getPrivateKey().toString('base64url')}\nST_CRON_SECRET=${randomBytes(32).toString('hex')}\nST_VAPID_SUBJECT=mailto:REPLACE_WITH_YOUR_EMAIL\n`,{mode:0o600});
console.log('Public VAPID key:',publicKey);console.log('Private settings saved to backend/.push-secrets.env. Keep this file out of GitHub.');
