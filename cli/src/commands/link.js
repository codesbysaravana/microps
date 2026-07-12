const inquirer = require('inquirer');
const chalk = require('chalk');
const { getApiClient, getToken } = require('../config');

module.exports = async function link() {
  const token = getToken();
  if (!token) {
    console.log(chalk.red('\n✕ Not authenticated. Run `microps login` first.\n'));
    process.exit(1);
  }

  const api = getApiClient();

  try {
    console.log(chalk.gray('Fetching your GitHub repositories...'));
    const reposResponse = await api.get('/github/repos');
    const reposList = reposResponse.data.repos;

    if (!reposList || reposList.length === 0) {
      console.log(chalk.yellow('\nNo GitHub repositories found. Make sure your GitHub account is linked.'));
      process.exit(1);
    }

    const { selectedRepo } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedRepo',
        message: 'Select a repository to link to MicrOps:',
        choices: reposList.map(repo => repo.full_name)
      }
    ]);

    const repoDetails = reposList.find(r => r.full_name === selectedRepo);

    console.log(chalk.gray(`\nInjecting MicrOps BYOC Action into ${selectedRepo}...`));
    
    await api.post('/github/repos/install-runner', {
      owner: repoDetails.owner.login,
      repo: repoDetails.name
    });

    console.log(chalk.green(`\n✓ Successfully linked ${selectedRepo}!`));
    console.log(chalk.gray(`The MicrOps GitHub Actions workflow has been installed in your repository.`));

  } catch (error) {
    console.log(chalk.red(`\n✕ Failed to link repository:`), error.response?.data?.message || error.message);
    process.exit(1);
  }
};
