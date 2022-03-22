// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import 'reflect-metadata';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import { createColors } from 'colorette';
import { config } from 'dotenv-cra';
import { join } from 'path';
import { inspect } from 'util';
import { WebhookClient } from 'discord.js';
import { srcDir } from '@lib/constants';
import { container } from '@sapphire/framework';

// Read env var
config({ path: join(srcDir, '.env') });

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
createColors({ useColor: true });

if (process.env.LOG_HOOK) {
	container.discordLogs = new WebhookClient({ url: process.env.LOG_HOOK });
}
