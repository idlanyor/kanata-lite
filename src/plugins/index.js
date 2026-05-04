import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadPlugins = async () => {
  const plugins = new Map();
  const pluginFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

  for (const file of pluginFiles) {
    const filePath = `./${file}`;
    const { default: plugin } = await import(filePath);
    if (plugin && (plugin.command || plugin.name)) {
      plugins.set(file, plugin);
    }
  }

  return plugins;
};
