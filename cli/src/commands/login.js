const inquirer = require('inquirer');
const chalk = require('chalk');
const { getApiClient, saveToken } = require('../config');

module.exports = async function login() {
  console.log(chalk.yellow('\nAuthenticate with MicrOps\n'));

  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email address:',
      validate: input => input.includes('@') || 'Please enter a valid email'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*',
      validate: input => input.length > 0 || 'Password is required'
    }
  ]);

  const api = getApiClient();

  try {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    });

    const result = response.data;
    if (result.success && result.data && result.data.token) {
      saveToken(result.data.token);
      console.log(chalk.green(`\n✓ Successfully authenticated as ${result.data.user.name}`));
      console.log(chalk.gray(`Token saved to ~/.microps/config.json\n`));
    } else {
      console.log(chalk.red(`\n✕ Unexpected response format from server.`));
    }
  } catch (error) {
    console.log(chalk.red(`\n✕ Authentication failed:`), error.response?.data?.message || error.message);
    process.exit(1);
  }
};
