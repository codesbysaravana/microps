/**
 * MicrOps Email Notification Service (using Resend API directly via fetch)
 * Zero dependencies to prevent any architectural bloat or conflicts.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// The email address that emails will be sent FROM (must be verified in Resend dashboard)
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'MicrOps <alerts@microps.in>';

export const emailService = {
  /**
   * Core send function using Resend's REST API.
   * Fails silently (only logs) to prevent blocking main application flows.
   */
  async sendEmail(to: string, subject: string, html: string) {
    if (!RESEND_API_KEY) {
      console.warn('[Email Service] Skipped sending email (RESEND_API_KEY is not set).');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [to],
          subject: subject,
          html: html
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Email Service] Failed to send email via Resend:', errorData);
      }
    } catch (err) {
      console.error('[Email Service] Fatal error sending email:', err);
    }
  },

  /**
   * Sent immediately when a user logs in for the very first time.
   */
  async sendWelcomeEmail(to: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Welcome to MicrOps, ${name}! 🚀</h2>
        <p>We're absolutely thrilled to have you onboard.</p>
        <p>MicrOps is the fastest way to deploy your code to secure, multi-tenant AWS infrastructure. You can now connect your GitHub repositories and deploy with a single click — no DevOps required.</p>
        <p><strong>Next steps:</strong></p>
        <ul>
          <li>Import your first GitHub repository</li>
          <li>Configure your environment variables</li>
          <li>Hit Deploy!</li>
        </ul>
        <p>If you run into any issues, just reply to this email.</p>
        <br/>
        <p>Happy deploying,<br/><strong>The MicrOps Team</strong></p>
      </div>
    `;
    return this.sendEmail(to, 'Welcome to MicrOps! 🚀', html);
  },

  /**
   * Sent when a GitHub Actions deployment successfully completes and goes live on ECS.
   */
  async sendDeploymentSuccessEmail(to: string, projectName: string, liveUrl: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #28a745;">Deployment Successful! ✅</h2>
        <p>Great news! Your project <strong>${projectName}</strong> has been successfully built and deployed to AWS.</p>
        <p>It is now live and accessible at:</p>
        <p><a href="${liveUrl}" style="background: #000; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">View Live App</a></p>
        <br/>
        <p>Alternatively, copy this link: <br/> <a href="${liveUrl}">${liveUrl}</a></p>
      </div>
    `;
    return this.sendEmail(to, `✅ ${projectName} deployed successfully`, html);
  },

  /**
   * Sent when a deployment fails during the build or provision stage.
   */
  async sendDeploymentFailedEmail(to: string, projectName: string, errorMessage: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #dc3545;">Deployment Failed ❌</h2>
        <p>We encountered an issue while trying to deploy your project <strong>${projectName}</strong>.</p>
        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 5px solid #dc3545; font-family: monospace;">
          ${errorMessage}
        </div>
        <p>Please check your MicrOps dashboard or GitHub Actions logs for more detailed information.</p>
      </div>
    `;
    return this.sendEmail(to, `❌ Deployment failed for ${projectName}`, html);
  }
};
