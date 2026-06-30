import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export interface EncryptedEnvPayload {
  encryptedPayload: string;
  iv: string;
}

export const ecryptAESnGCM = (plainText: string): EncryptedEnvPayload => {
  const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '12345678901234567890123456789012', 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedPayload: `${authTag}:${encrypted}`,
    iv: iv.toString('hex'),
  };
};

export const decryptAESnGCM = (encryptedPayload: string, ivHex: string): string => {
  const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '12345678901234567890123456789012', 'utf8');
  const [authTagHex, encryptedText] = encryptedPayload.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
