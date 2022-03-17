import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandOptions, UserError } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import parse from 'parse-duration';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { dateToTimestamp, sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Create a poll!',
	aliases: ['vote'],
	flags: ['multiselect', 'ms'],
	options: ['ends'],
	detailedDescription: {
		usage: '<question> | <choices...> (--ends=duration) (--multiselect)',
		examples: [
			'Is butt legs? | Butt is legs | Butt is butt',
			'Should I do it? | Do it | Let your dreams be memes --ends:30m'
		],
		extendedHelp: `• Polls must have at least two options an no more than 10.
		• You can allow people to vote for more than one option with the \`--multiselect\` flag.
		• You can specify when a poll should end with the \`--ends\` option. By default, polls never end.`
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		let choices = (await args.rest('string')).split('|');
		const question = choices.shift();

		if (!question || choices.length < 2 || choices.length > 10) {
			throw new UserError({
				identifier: 'InvalidChoiceAmount',
				message:
					'Polls must have at least two options an no more than 10.'
			});
		}

		const response = await sendLoadingMessage(msg);

		const emotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		choices = choices.map(choice => `${emotes.shift()} ${choice}`);

		const rawExpires = args.getOption('ends');
		const expires = new Date(Date.now() + parse(rawExpires ?? '1d'));

		const embed = new MessageEmbed()
			.setTitle(question)
			.setColor('RANDOM')
			.setAuthor({
				name: `${
					msg.member?.displayName ?? msg.author.username
				} asks...`,
				iconURL:
					msg.member?.displayAvatarURL({ dynamic: true })
					?? msg.author.displayAvatarURL({ dynamic: true })
			})
			.setDescription(
				`${choices.join('\n')}\n\nThis poll ends at ${dateToTimestamp(
					expires,
					'f'
				)}`
			);

		const components: MessageActionRow[] = [];

		chunk(choices, 2).forEach((pair) => {
			const row = new MessageActionRow();
			pair.forEach((choice) => {
				row.addComponents([
					new MessageButton()
						.setCustomId(
							`poll|${choices.indexOf(choice)}|${response.id}`
						)
						.setStyle('PRIMARY')
						.setLabel(
							choice.length < 80
								? choice
								: `${choice.substring(0, 77)}...`
						)
				]);
			});
			components.push(row);
		});

		await this.client.db.polls.insertOne({
			messageId: response.id,
			channelId: response.channel.id,
			multiSelect: args.getFlags('multiselect', 'ms'),
			expires,
			allVoters: [],
			choices: choices.map((choice) => ({
				text: choice,
				voters: [],
				votes: 0
			}))
		});

		response.edit({ content: ' ', embeds: [embed], components });
	}

}
