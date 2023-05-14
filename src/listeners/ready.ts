import { Octokit } from '@octokit/rest';
import { Listener, type ListenerOptions, type PieceContext, Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { Collection, WebhookClient } from 'discord.js';
import { readFileSync } from 'fs';

const dev = process.env.NODE_ENV !== 'production';

export class UserEvent extends Listener {

	private readonly style = dev ? yellow : blue;

	public constructor(context: PieceContext, options?: ListenerOptions) {
		super(context, {
			...options,
			once: true
		});
	}

	public run() {
		this.printBanner();
		this.printStoreDebugInformation();
		this.logStartupToDiscord();
		this.createCountChannelCache();
		this.createRPchannelCache();
		this.createCmdStatsCache();
		this.gitHubLogin();
		return;
	}

	private async logStartupToDiscord() {
		if (!this.container.hooks.discordLogs) return;

		const { user } = this.container.client;

		if (!user) return;

		this.container.hooks.discordLogs.send({
			username: user.username,
			avatarURL: user.displayAvatarURL(),
			content: `${process.env.BOT_NAME} started. Ready to serve ${this.container.client.guilds.cache.size} guilds.`
		});
	}

	private async createRPchannelCache() {
		this.container.rpChannels = new Map();
		const guilds = await this.container.db.guilds.find().toArray();

		guilds.forEach(guild => {
			const rpChannel = guild.channels?.rolePlay;
			if (rpChannel) {
				this.container.rpChannels.set(rpChannel.channel, new WebhookClient({ url: rpChannel.hook }));
			}
		});
	}

	private async gitHubLogin() {
		if (process.env.GIT_HUB && process.env.REPO_OWNER && process.env.REPO_NAME) {
			const botVersion = JSON.parse(readFileSync(`${process.cwd()}/package.json`).toString()).version;
			this.container.gitHub = new Octokit({ auth: process.env.GIT_HUB, userAgent: `$${process.env.BOT_NAME} v${botVersion}` });
			return;
		}
		this.container.gitHub = null;
	}
	private async createCmdStatsCache() {
		const cmdStats = await this.container.db.cmdStats.findOne();
		this.container.cmdStats = new Collection<string, number>();

		cmdStats?.data.forEach(stat => this.container.cmdStats.set(stat.command, stat.uses));

		this.container.statusUpdateFlag = 0;
	}

	private async createCountChannelCache() {
		const countGuilds = await this.container.db.guilds.find({ 'channels.count': { $exists: true } }).toArray();

		countGuilds.forEach(dbGuild => {
			if (dbGuild.channels?.count) {
				this.container.client.countChannels.set(dbGuild.channels.count, dbGuild);
			}
		});
	}

	private printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${
	dev
		? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc(
			'DEVELOPMENT MODE'
					  )}`
		: ''
}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private styleStore(store: Store<any>, last: boolean) {
		return gray(
			`${last ? '└─' : '├─'} Loaded ${this.style(
				store.size.toString().padEnd(3, ' ')
			)} ${store.name}.`
		);
	}

}
