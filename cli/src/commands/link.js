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
    console.log(chalk.gray('Fetching your MicrOps projects...'));
    const projectsResponse = await api.get('/projects');
    const projectsList = projectsResponse.data.data; // Note: using data.data based on earlier fixes

    if (!projectsList || projectsList.length === 0) {
      console.log(chalk.yellow('\nNo projects found. Please create a project in the web dashboard first.'));
      process.exit(1);
    }

    const { selectedProject } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProject',
        message: 'Select a MicrOps project to link to:',
        choices: projectsList.map(project => ({ name: project.name, value: project.id }))
      }
    ]);

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
        message: 'Select a repository to link to this project:',
        choices: reposList.map(repo => repo.full_name)
      }
    ]);

    const repoDetails = reposList.find(r => r.full_name === selectedRepo);

    console.log(chalk.gray(`\nInjecting MicrOps BYOC Action into ${selectedRepo}...`));
    
    await api.post('/github/repos/install-runner', {
      owner: repoDetails.owner.login,
      repo: repoDetails.name,
      projectId: selectedProject
    });

    console.log(chalk.green(`\n✓ Successfully linked ${selectedRepo}!`));
    console.log(chalk.gray(`The MicrOps GitHub Actions workflow has been installed in your repository.`));
    
    console.log(chalk.yellow(`\n☁️  [Optional] Bring Your Own Cloud (BYOC) Setup:`));
    console.log(chalk.gray(`To deploy directly to your own AWS account securely (without giving us your access keys),`));
    console.log(chalk.gray(`create an IAM OIDC Provider for GitHub Actions and add the following secret to your repo:`));
    console.log(chalk.cyan(`  AWS_ROLE_ARN`));
    console.log(chalk.gray(`If this secret is present, the pipeline will deploy to your AWS account. If not, it falls back to the MicrOps cloud.`));

  } catch (error) {
    console.log(chalk.red(`\n✕ Failed to link repository:`), error.response?.data?.message || error.message);
    process.exit(1);
  }
};
