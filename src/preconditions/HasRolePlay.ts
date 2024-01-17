import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, Guild, Message } from 'discord.js';

export class UserPrecondition extends Precondition {

	public async messageRun(msg: Message) {
		if (!msg.inGuild()) {
			return this.error({ message: 'This command must be run in a server.' });
		}

		if (await this.checkRP(msg.guild)) {
			return this.ok();
		}
		return this.error({ message: 'This server does not have a role play channel.' });
	}

	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) {
			return this.error({ message: 'This command must be run in a server.' });
		}

		if (await this.checkRP(interaction.guild)) {
			return this.ok();
		}
		return this.error({ message: 'This server does not have a role play channel.' });
	}

	private async checkRP(guild: Guild): Promise<boolean> {
		const dbGuild = await this.container.db.guilds.findOne({ id: guild.id });

		return !!dbGuild?.channels?.rolePlay && dbGuild.channels.rolePlay.length > 0;
	}

}

declare module '@sapphire/framework' {
	interface Preconditions {
		HasRolePlay: never;
	}
}
