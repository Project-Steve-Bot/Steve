// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import 'reflect-metadata';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-subcommands/register';
import { createColors } from 'colorette';
import { join } from 'path';
import { inspect } from 'util';
import { WebhookClient } from 'discord.js';
import { srcDir } from '@lib/constants';
import { container } from '@sapphire/framework';
import { setup } from '@skyra/env-utilities';

// Read env var
setup({ path: join(srcDir, '.env') });

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
createColors({ useColor: true });

container.hooks = {
	discordLogs: process.env.LOG_HOOK ? new WebhookClient({ url: process.env.LOG_HOOK }) : null,
	suggest: process.env.SUGGEST_HOOK ? new WebhookClient({ url: process.env.SUGGEST_HOOK }) : null
};
