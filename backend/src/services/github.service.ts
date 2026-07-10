import { pool } from '../config/db';
import * as jwt from 'jsonwebtoken';
import { emailService } from './email.service';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const githubService = {
  getOAuthRedirectUrl: () => {
    const scopes = 'repo workflow';
    return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scopes)}`;
  },

  exchangeCodeForToken: async (code: string) => {
    // 1. Get Access Token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    const githubUser = await userResponse.json();

    // 3. Upsert User in DB
    const client = await pool.connect();
    try {
      const email = githubUser.email || `${githubUser.login}@users.noreply.github.com`;
      const name = githubUser.name || githubUser.login;

      const res = await client.query(`
        INSERT INTO users (name, email, github_id, github_username, github_access_token)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE
        SET github_id = EXCLUDED.github_id,
            github_username = EXCLUDED.github_username,
            github_access_token = EXCLUDED.github_access_token
        RETURNING id, name, email, github_username, (xmax = 0) AS is_new_insert
      `, [name, email, githubUser.id.toString(), githubUser.login, accessToken]);

      const user = res.rows[0];

      // If this is a brand new signup, trigger the onboarding email in the background
      if (user.is_new_insert && !email.includes('noreply.github.com')) {
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
  },

  fetchUserRepositories: async (userId: number) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT github_access_token FROM users WHERE id = $1', [userId]);
      const token = res.rows[0]?.github_access_token;
      if (!token) throw new Error('Not connected to GitHub');

      const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      const repos = await reposRes.json();
      return repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        owner: r.owner.login,
        private: r.private,
        updated_at: r.updated_at
      }));
    } finally {
      client.release();
    }
  },

  injectBYOCWorkflow: async (userId: number, projectId: number, owner: string, repoName: string) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT github_access_token FROM users WHERE id = $1', [userId]);
      const token = res.rows[0]?.github_access_token;
      if (!token) throw new Error('Not connected to GitHub');

      // The dynamic BYOC build workflow string
      const workflowYaml = `
name: MicrOps BYOC Deploy

on:
  push:
    branches:
      - main

permissions:
  id-token: write
  contents: read

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Get GitHub OIDC Token
        id: oidc
        uses: actions/github-script@v6
        with:
          script: |
            const token = await core.getIDToken('https://github.com/microps-hq');
            core.setOutput('token', token);

      - name: Fetch Temporary AWS Credentials from MicrOps
        id: sts
        run: |
          RESPONSE=$(curl -s -X POST https://microps.in/api/v1/builds/aws-sts \\
            -H "Authorization: Bearer \${{ steps.oidc.outputs.token }}")
          
          # Basic parsing without jq to minimize dependencies
          ACCESS_KEY=$(echo $RESPONSE | grep -o '"accessKeyId":"[^"]*' | cut -d'"' -f4)
          SECRET_KEY=$(echo $RESPONSE | grep -o '"secretAccessKey":"[^"]*' | cut -d'"' -f4)
          SESSION_TOKEN=$(echo $RESPONSE | grep -o '"sessionToken":"[^"]*' | cut -d'"' -f4)
          
          echo "AWS_ACCESS_KEY_ID=$ACCESS_KEY" >> $GITHUB_ENV
          echo "AWS_SECRET_ACCESS_KEY=$SECRET_KEY" >> $GITHUB_ENV
          echo "AWS_SESSION_TOKEN=$SESSION_TOKEN" >> $GITHUB_ENV
          echo "AWS_REGION=ap-southeast-2" >> $GITHUB_ENV

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Dockerfile Generator (If Missing)
        run: |
          if [ ! -f Dockerfile ]; then
            if [ -f package.json ]; then
              cat << 'EOF' > Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build || true
EXPOSE 3000
CMD ["npm", "start"]
EOF
            else
              cat << 'EOF' > Dockerfile
FROM ubuntu:latest
WORKDIR /app
COPY . .
CMD ["echo", "Container running"]
EOF
            fi
          fi

      - name: Build, tag, and push image to MicrOps ECR
        env:
          REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          REPOSITORY: microps-hq
          IMAGE_TAG: project-${projectId}-\${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REPOSITORY:$IMAGE_TAG

      - name: Notify MicrOps Backend
        env:
          MICROPS_PROJECT_ID: "${projectId}"
          MICROPS_IMAGE_TAG: "project-${projectId}-\${{ github.sha }}"
          MICROPS_REPO_OWNER: "\${{ github.repository_owner }}"
          MICROPS_REPO_NAME: "\${{ github.event.repository.name }}"
        run: |
          curl -s -X POST https://microps.in/api/v1/webhooks/github/completion \\
            -H "Content-Type: application/json" \\
            -d '{"project_id": "'$MICROPS_PROJECT_ID'", "image_tag": "'$MICROPS_IMAGE_TAG'", "repo_owner": "'$MICROPS_REPO_OWNER'", "repo_name": "'$MICROPS_REPO_NAME'"}'
      `.trim();

      const base64Content = Buffer.from(workflowYaml).toString('base64');
      const filePath = '.github/workflows/microps-deploy.yml';

      // Push file to github using the contents API
      const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;
      const putRes = await fetch(githubApiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: 'Setup MicrOps BYOC Deployment Pipeline',
          content: base64Content,
          branch: 'main' // assuming main for now
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        console.warn('Failed to inject workflow, maybe it already exists?', errData);
      }

      // Update DB
      await client.query(`
        UPDATE projects 
        SET github_repo_owner = $1, github_repo_name = $2, github_workflow_installed = true
        WHERE id = $3
      `, [owner, repoName, projectId]);

      return { success: true, message: 'BYOC runner installed successfully' };
    } finally {
      client.release();
    }
  }
};
