const inquirer = require('inquirer');
const chalk = require('chalk');
const { getApiClient, getToken } = require('../config');

module.exports = async function deploy() {
  const token = getToken();
  if (!token) {
    console.log(chalk.red('\n✕ Not authenticated. Run `microps login` first.\n'));
    process.exit(1);
  }

  const api = getApiClient();

  try {
    console.log(chalk.yellow('\n🚀 Configure New Deployment\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project Name:',
        validate: input => input.length > 0 || 'Project name is required'
      },
      {
        type: 'input',
        name: 'githubRepo',
        message: 'GitHub Repo URL (e.g., https://github.com/user/repo):',
        validate: input => input.includes('github.com') || 'Please enter a valid GitHub URL'
      },
      {
        type: 'input',
        name: 'branch',
        message: 'Branch:',
        default: 'main'
      },
      {
        type: 'number',
        name: 'port',
        message: 'Application Port:',
        default: 3000
      }
    ]);

    console.log(chalk.gray('\nTriggering deployment...'));

    const response = await api.post('/build/deploy', {
      projectName: answers.projectName,
      githubRepo: answers.githubRepo,
      branch: answers.branch,
      port: answers.port,
      envVars: [] // Can be expanded later to support .env file uploads
    });

    console.log(chalk.green(`\n✓ Deployment Initiated!`));
    console.log(chalk.gray(`Project ID: ${response.data.data.projectId}`));
    console.log(chalk.gray(`View live status at: https://microps.in/dashboard`));

  } catch (error) {
    console.log(chalk.red(`\n✕ Deployment failed:`), error.response?.data?.message || error.message);
    process.exit(1);
  }
};
