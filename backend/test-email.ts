import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.development explicitly
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

import { emailService } from './src/services/email.service';

async function testEmail() {
  console.log('Testing Email Service...');
  console.log('API Key configured:', process.env.RESEND_API_KEY ? 'YES' : 'NO');
  console.log('Sender Email:', process.env.RESEND_SENDER_EMAIL);

  try {
    console.log('\nSending test email...');
    
    // We will pass the from/to in the service. 
    // We will use the email service to send a welcome email to the SENDER_EMAIL itself (or a dummy) for testing.
    // If SENDER_EMAIL is something like alerts@microps.in, sending to itself is fine.
    const testTo = 'saravana.cs14@gmail.com'; // or we can use the sender email
    
    await emailService.sendWelcomeEmail(testTo, 'Test User');
    
    console.log('✅ sendWelcomeEmail function completed without throwing errors.');
    console.log('NOTE: If Resend failed, the error should have been printed by the service itself above this line.');
  } catch (err) {
    console.error('❌ Test failed with exception:', err);
  }
}

testEmail();
