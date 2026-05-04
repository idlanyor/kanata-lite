import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { config } from '../config/env.js';
import { db } from '../config/database.js';

/**
 * Centralized Terminal Logger
 */
export const terminal = {
  log: (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: chalk.cyan,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
      pairing: chalk.magenta,
      msg: chalk.white,
    };
    const prefix = {
      info: 'ℹ',
      success: '✔',
      warn: '⚠',
      error: '✖',
      pairing: '🔑',
      msg: '💬',
    };
    
    const color = colors[type] || chalk.white;
    const icon = prefix[type] || '•';
    
    console.log(
      `${chalk.gray(`[${timestamp}]`)} ${color.bold(icon)} ${color(message)}`
    );
  },
  
  banner: () => {
    console.clear();
    const bannerText = figlet.textSync(config.botName, { font: 'Small' });
    console.log(gradient.pastel.multiline(bannerText));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.bold('Bot Name  :')} ${chalk.cyan(config.botName)}`);
    console.log(`${chalk.bold('Prefix    :')} ${chalk.yellow(config.prefix)}`);
    console.log(`${chalk.bold('Auth Mode :')} ${chalk.magenta(config.authMode)}`);
    console.log(`${chalk.bold('Anti-Call :')} ${db.data.settings.antiCall ? chalk.green('ON') : chalk.red('OFF')}`);
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
  }
};
