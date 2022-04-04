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
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Read env var
config({ path: join(srcDir, '.env') });

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
createColors({ useColor: true });

container.hooks = {
	discordLogs: process.env.LOG_HOOK ? new WebhookClient({ url: process.env.LOG_HOOK }) : null,
	suggest: process.env.SUGGEST_HOOK ? new WebhookClient({ url: process.env.SUGGEST_HOOK }) : null
};

Chart.defaults.color = 'white';
Chart.defaults.font.size = 26;
Chart.register(ChartDataLabels);
