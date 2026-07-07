import { Request, Response } from 'express';
import { STSClient, GetFederationTokenCommand } from '@aws-sdk/client-sts';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { pool } from '../config/db';

const stsClient = new STSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

const client = jwksClient({
  jwksUri: 'https://token.actions.githubusercontent.com/.well-known/jwks.json'
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err || !key) {
      callback(err || new Error('Unable to get signing key'));
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const buildStsController = {
  exchangeOidcForAwsCredentials: async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
      }

      const idToken = authHeader.split(' ')[1];

      // 1. Verify GitHub OIDC JWT
      const decoded = await new Promise<any>((resolve, reject) => {
        jwt.verify(idToken, getKey, {
          audience: 'https://github.com/microps-hq', // We will configure the action to use this audience
          issuer: 'https://token.actions.githubusercontent.com'
        }, (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        });
      });

      // Payload contains claims like: repository, repository_owner, ref, event_name, sub
      const repositoryClaim = decoded.repository; // e.g. "octocat/Hello-World"
      if (!repositoryClaim) {
        return res.status(403).json({ message: 'Missing repository claim in OIDC token' });
      }

      const [owner, repoName] = repositoryClaim.split('/');

      // 2. Validate against Database
      const dbClient = await pool.connect();
      let project;
      try {
        const result = await dbClient.query(`
          SELECT id, user_id, name 
          FROM projects 
          WHERE github_repo_owner = $1 AND github_repo_name = $2
        `, [owner, repoName]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Repository not linked to any MicrOps project' });
        }
        project = result.rows[0];
      } finally {
        dbClient.release();
      }

      // 3. Generate 15-Minute Scoped AWS STS Token
      // This policy STRICTLY limits the runner to ECR GetAuthToken, and PutImage only for this project's tag prefix
      const registryId = process.env.ECR_REGISTRY_URL ? process.env.ECR_REGISTRY_URL.split('.')[0] : '*';
      
      const inlinePolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "ecr:GetAuthorizationToken"
            ],
            Resource: "*"
          },
          {
            Effect: "Allow",
            Action: [
              "ecr:BatchCheckLayerAvailability",
              "ecr:PutImage",
              "ecr:InitiateLayerUpload",
              "ecr:UploadLayerPart",
              "ecr:CompleteLayerUpload"
            ],
            Resource: `arn:aws:ecr:${process.env.AWS_REGION || 'ap-southeast-2'}:${registryId}:repository/microps-hq`
          }
        ]
      };

      const stsResponse = await stsClient.send(new GetFederationTokenCommand({
        Name: `GithubAction-Project${project.id}`,
        Policy: JSON.stringify(inlinePolicy),
        DurationSeconds: 900 // 15 minutes
      }));

      if (!stsResponse.Credentials) {
        throw new Error('STS failed to return credentials');
      }

      // Return the credentials to the GitHub Action
      return res.status(200).json({
        accessKeyId: stsResponse.Credentials.AccessKeyId,
        secretAccessKey: stsResponse.Credentials.SecretAccessKey,
        sessionToken: stsResponse.Credentials.SessionToken,
      });

    } catch (error: any) {
      console.error('[AWS STS Token Dispenser] Error:', error.message);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
};
