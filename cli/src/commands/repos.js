const chalk = require('chalk');
const { getApiClient, getToken } = require('../config');

module.exports = async function repos() {
  const token = getToken();
  if (!token) {
    console.log(chalk.red('\n✕ Not authenticated. Run `microps login` first.\n'));
    process.exit(1);
  }

  const api = getApiClient();
  
  try {
    const response = await api.get('/github/repos');
    const reposList = response.data.repos;

    console.log(chalk.yellow('\n🐙 Your GitHub Repositories:\n'));

    if (reposList.length === 0) {
      console.log(chalk.gray('No GitHub repositories found.'));
    } else {
      reposList.forEach(repo => {
        console.log(`${chalk.bold(repo.full_name)}`);
        console.log(`URL:    ${chalk.blue.underline(repo.html_url)}`);
        console.log(`Branch: ${chalk.gray(repo.default_branch)}`);
        console.log('');
      });
    }

  } catch (error) {
    console.log(chalk.red(`\n✕ Failed to fetch repositories:`), error.response?.data?.message || error.message);
    process.exit(1);
  }
};
