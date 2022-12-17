import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions, DetailedDescriptionCommand, MessageCommandContext } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { EmbedField, Message, MessageEmbed, Util } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: `Shows info about ${process.env.BOT_NAME}'s commands.`,
	detailedDescription: {
		usage: '(command)',
		examples: ['', 'remind']
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args, ctx: MessageCommandContext) {
		const commands = msg.client.stores.get('commands');
		const { prefix } = ctx;

		if (args.finished) {
			let helpStr = `You can do ${prefix}help <command> to get more info about a specific command!\n`;

			const { categories } = commands;

			await Promise.all(
				categories.map(async (cat) => {
					const commandUsabilityList = await Promise.all(
						commands.map(async (cmd) => {
							const cmdData: { command: string, useable: boolean } = {
								command: cmd.name,
								useable: false
							};

							if (cmd.supportsMessageCommands()) {
								const result = await cmd.preconditions.messageRun(msg, cmd, { external: true });
								cmdData.useable = cmd.category === cat && cmd.enabled && result.isOk();
							}

							return cmdData;
						})
					);

					const useableCommands = commands.filter(
						(cmd) => commandUsabilityList.find((useabilityStatus) => useabilityStatus.command === cmd.name)?.useable ?? false
					);

					if (useableCommands.size > 0) {
						helpStr += `\n**${cat} Commands**\n`;
						useableCommands.forEach((cmd) => {
							helpStr += `${
								cmd.supportsChatInputCommands()
									? '<:supportsSlashCommands:1053479279343710328>'
									: ''
							}\`${prefix}${cmd.name}\` ⇒ ${cmd.description ?? 'No Description provided'}\n`;
						});
					}
				})
			);

			const splitStr = Util.splitMessage(helpStr, { char: '\n' });
			let notified = false;
			splitStr.forEach((helpMsg) => {
				msg.author
					.send(helpMsg)
					.then(() => {
						if (!notified) {
							if (msg.channel.type !== 'DM') send(msg, '📥 | The list of commands you have access to has been sent to your DMs.');
							notified = true;
						}
					})
					.catch(() => {
						if (!notified) {
							send(msg, "❌ | You have DMs disabled, I couldn't send you the commands in DMs.");
							notified = true;
						}
					});
			});
		} else {
			const input = await args.rest('string');
			const cmd = commands.get(input);

			if (!cmd) {
				send(msg, `I couldn't find a command called **${input}**.`);
				return;
			}

			const fields: Array<EmbedField> = [];

			const details: DetailedDescriptionCommand = cmd.detailedDescription;

			if (typeof details === 'string') {
				if (details) {
					fields.push({
						name: 'Extra info',
						value: details,
						inline: false
					});
				}
				if (cmd.aliases.length > 0) {
					fields.push({
						name: 'Aliases',
						value: `\`${cmd.aliases.join('`, `')}\``,
						inline: true
					});
				}
			} else {
				const prefixedName = `${prefix}${cmd.name}`;
				if (details.usage) {
					fields.push({
						name: 'Usage',
						value: `${prefixedName} ${details.usage}`,
						inline: true
					});
				}
				if (cmd.aliases.length > 0) {
					fields.push({
						name: 'Aliases',
						value: `\`${cmd.aliases.join('`, `')}\``,
						inline: true
					});
				}
				if (details.examples) {
					fields.push({
						name: 'Examples',
						value: `${prefixedName} ${details.examples.join(`\n${prefixedName} `)}`,
						inline: false
					});
				}
				if (details.extendedHelp) {
					fields.push({
						name: 'Extra Info',
						value: details.extendedHelp,
						inline: false
					});
				}
			}

			const { options, flags } = cmd.options;

			if (Array.isArray(options) && options.length > 0) {
				fields.push({
					name: 'Options',
					value: `\`--${options.join('`, `--')}\``,
					inline: true
				});
			}

			if (Array.isArray(flags) && flags.length > 0) {
				fields.push({
					name: 'Options',
					value: `\`--${flags.join('`, `--')}\``,
					inline: true
				});
			}

			const embed = new MessageEmbed()
				.setAuthor({ iconURL: msg.client.user?.avatarURL() ?? undefined, name: cmd.name })
				.setTitle(cmd.description)
				.addFields(fields)
				.setColor('RANDOM');

			if (cmd.supportsChatInputCommands()) {
				embed.setDescription(`<:supportsSlashCommands:1053479279343710328> You can also run ${cmd.name} using slash commands!`);
			}

			send(msg, { embeds: [embed] });
		}
	}

}
