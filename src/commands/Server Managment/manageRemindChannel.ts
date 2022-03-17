import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Sets the channel reminders are to be sent in.',
	aliases: ['remindChannel'],
	requiredUserPermissions: ['MANAGE_CHANNELS'],
	runIn: ['GUILD_ANY'],
	detailedDescription: {
		usage: '(channel)',
		examples: ['', '#steves_tree'],
		extendedHelp:
			'Running this command with no arguments allows reminders to be sent in any channel.'
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

		await this.client.db.guilds.updateOne(
			{ id: msg.guild.id },
			{ $set: { channels: { reminder: channel?.id } } },
			{ upsert: true }
		);

		if (channel) {
			return send(
				msg,
				`Reminders will now always be sent to <#${channel.id}>.`
			);
		}
		return send(msg, 'Reminders can now be sent in any channel.');
	}

}
