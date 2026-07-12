import { pool } from '../config/db';
import * as jwt from 'jsonwebtoken';
import { emailService } from './email.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
// Must exactly match the redirect URI registered in Google Cloud Console
const REDIRECT_URI = 'https://microps.in/api/v1/google/auth/callback'; 

export const googleService = {
  getOAuthRedirectUrl: () => {
    const scopes = 'email profile';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
  },

  exchangeCodeForToken: async (code: string) => {
    // 1. Get Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google code for token');
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    const googleUser = await userResponse.json();

    // 3. Upsert User in DB
    const client = await pool.connect();
    try {
      const email = googleUser.email;
      const name = googleUser.name;
      const googleId = googleUser.id;

      if (!email) {
        throw new Error('Google account must have an email address');
      }

      const res = await client.query(`
        INSERT INTO users (name, email, google_id, google_access_token)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE
        SET google_id = EXCLUDED.google_id,
            google_access_token = EXCLUDED.google_access_token,
            name = CASE WHEN users.name IS NULL OR users.name = '' THEN EXCLUDED.name ELSE users.name END
        RETURNING id, name, email, (xmax = 0) AS is_new_insert
      `, [name, email, googleId, accessToken]);

      const user = res.rows[0];

      // If this is a brand new signup, trigger the onboarding email in the background
      if (user.is_new_insert) {
        emailService.sendWelcomeEmail(user.email, user.name).catch(console.error);
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      return { token, user };
    } finally {
      client.release();
    }
  }
};
