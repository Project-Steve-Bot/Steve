import { Listener, ListenerOptions, PieceContext, Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { Collection } from 'discord.js';

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
		this.createCmdStatsCache();
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
