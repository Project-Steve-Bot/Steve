import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
	description: 'Sets the channel rolls are logged to.',
	aliases: ['mrl', 'rollchannel'],
	requiredUserPermissions: ['ManageChannels'],
	runIn: ['GUILD_ANY'],
	detailedDescription: {
		examples: ['', '#roll_log'],
		extendedHelp: 'Running this command with no arguments disables the roll log.'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.guild) {
			return send(msg, 'You need to run this command in a server mate.');
		}

		const channel = args.finished
			? undefined
			: await args.pick('guildTextChannel');

		await this.container.db.guilds.updateOne(
			{ id: msg.guild.id },
			{ $set: { channels: { rolls: channel?.id } } },
			{ upsert: true }
		);

		if (channel) {
			return send(msg, `Dice rolls will now be logged in <#${channel.id}>.`);
		}
		return send(msg, 'Dice rolls are no longer logged.');
	}

}
