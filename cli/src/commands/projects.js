const chalk = require('chalk');
const { getApiClient, getToken } = require('../config');

module.exports = async function projects() {
  const token = getToken();
  if (!token) {
    console.log(chalk.red('\n✕ Not authenticated. Run `microps login` first.\n'));
    process.exit(1);
  }

  const api = getApiClient();
  
  try {
    const response = await api.get('/projects');
    const projectsList = response.data.projects || [];

    console.log(chalk.yellow('\n📦 Your MicrOps Projects:\n'));

    if (projectsList.length === 0) {
      console.log(chalk.gray('No projects found in this organization.'));
    } else {
      projectsList.forEach(project => {
        const statusColor = project.status === 'online' ? chalk.green : 
                            project.status === 'failed' ? chalk.red : chalk.yellow;
        
        console.log(`${chalk.bold(project.name)} ${chalk.gray(`(${project.id})`)}`);
        console.log(`Status: ${statusColor(project.status.toUpperCase())}`);
        if (project.live_url) {
          console.log(`URL:    ${chalk.blue.underline(project.live_url)}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.log(chalk.red(`\n✕ Failed to fetch projects:`), error.response?.data?.message || error.message);
    process.exit(1);
  }
};
