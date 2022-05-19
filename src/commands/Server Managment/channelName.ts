import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandOptions, UserError } from '@sapphire/framework';
import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Suggest a channel name and let everyone vote on it.',
	aliases: ['name'],
	runIn: 'GUILD_TEXT',
	enabled: false
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!msg.inGuild()) {
			throw new UserError({
				identifier: 'NotInGuild',
				message: 'This command needs to be run in a guild.'
			});
		}

		const response = await sendLoadingMessage(msg);

		const newName = (await args.rest('string')).toLowerCase().replaceAll(' ', '_');
		const needed = 3;

		const embed = new MessageEmbed()
			.setAuthor({
				name: `${msg?.member?.displayName ?? msg.author.username} suggested a channel name change!`,
				iconURL: msg.author.displayAvatarURL() })
			.setTitle(`Rename this channel to #${newName}?`)
			.setColor('RANDOM');

		const buttons = new MessageActionRow()
			.addComponents([
				new MessageButton()
					.setCustomId('rename|yes')
					.setEmoji('✅')
					.setStyle('SUCCESS')
					.setLabel(`${needed} votes needed to pass`),
				new MessageButton()
					.setCustomId('rename|no')
					.setEmoji('❎')
					.setStyle('DANGER')
					.setLabel(`${needed} votes needed to decline`)
			]);

		await this.container.db.channelRename.insertOne({
			messageId: response.id,
			channelId: msg.channelId,
			newName,
			requester: msg.author.id,
			yesVoters: [],
			noVoters: []
		});

		return response.edit({ content: ' ', embeds: [embed], components: [buttons] });
	}

}
