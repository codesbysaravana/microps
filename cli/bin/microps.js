#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const loginCmd = require('../src/commands/login');
const projectsCmd = require('../src/commands/projects');
const reposCmd = require('../src/commands/repos');
const linkCmd = require('../src/commands/link');
const deployCmd = require('../src/commands/deploy');

const program = new Command();

program
  .name('microps')
  .description(chalk.yellow('MicrOps CLI - Precision cloud orchestration'))
  .version(require('../package.json').version);

// Login Command
program
  .command('login')
  .description('Authenticate with the MicrOps platform')
  .action(loginCmd);

// Projects Command
program
  .command('projects')
  .description('List all your active infrastructure projects')
  .action(projectsCmd);

// Repos Command
program
  .command('repos')
  .description('List all connected GitHub repositories')
  .action(reposCmd);

// Link Command
program
  .command('link')
  .description('Install the MicrOps BYOC Action into a GitHub repository')
  .action(linkCmd);

// Deploy Command
program
  .command('deploy')
  .description('Trigger a new cloud deployment from a linked repository')
  .action(deployCmd);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
