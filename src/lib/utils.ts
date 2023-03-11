import { container } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { oneLine } from 'common-tags';
import {
	Channel,
	Collection,
	ColorResolvable,
	Guild,
	Message,
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	EmbedBuilder,
	User,
	ButtonStyle
} from 'discord.js';
import type { WithId } from 'mongodb';
import prettyMilliseconds from 'pretty-ms';
import { RandomLoadingMessage } from '@lib/constants';
import type { Reminder, DbUser, CountData } from '@lib/types/database';


export function pickRandom<T>(array: readonly T[]): T {
	const { length } = array;
	return array[Math.floor(Math.random() * length)];
}

export function getLoadingMessage() {
	return pickRandom(RandomLoadingMessage);
}

export function sendLoadingMessage(message: Message): Promise<typeof message> {
	return send(message, getLoadingMessage());
}

export async function getUserReminders(
	user: DbUser
): Promise<WithId<Reminder>[]> {
	const reminders = await container.db.reminder
		.find({ user: user.id })
		.toArray();
	return reminders.sort((a, b) => a.expires.valueOf() - b.expires.valueOf());
}

export async function getGuild(guildId: string): Promise<Guild> {
	return (
		container.client.guilds.cache.get(guildId)
		?? await container.client.guilds.fetch(guildId)
	);
}

export async function getChannel(
	channelId: string
): Promise<Channel | null> {
	return (
		container.client.channels.cache.get(channelId)
		?? await container.client.channels.fetch(channelId)
	);
}

export async function getUser(userId: string): Promise<User> {
	return (
		container.client.users.cache.get(userId)
		?? await container.client.users.fetch(userId)
	);
}

export function makeColorEmbed(color: ColorResolvable): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(color)
		.setThumbnail(`https://singlecolorimage.com/get/${color.toString(16).padStart(6, '0')}/400x400`);
}

export function pluralize(word: string, num: number): string {
	return `${word}${num !== 1 ? 's' : ''}`;
}

export async function resetCount(msg: Message, reason: string, ping = false, deleted = false) {
	if (!msg.inGuild()) {
		throw new Error('Cannot reset count on a message not in a guild.');
	}

	if (deleted) {
		await msg.channel.send({
			content: `<@${msg.author.id}>, ${reason}`,
			allowedMentions: { users: ping ? [msg.author.id] : [] }
		});
	} else {
		await msg.reply({ content: reason, allowedMentions: { repliedUser: ping } });
	}

	const dbGuild = await container.db.guilds.findOne({ id: msg.guildId });

	if (!dbGuild?.count) {
		throw new Error('Cannot reset count in a guild with now running count.');
	}

	const { counter, participants, started, max, maxPin } = dbGuild.count;
	const newMax = counter > max;
	const timeTaken = Date.now() - started.getTime();

	const embed = new EmbedBuilder()
		.setTitle(`The count has ended at ${counter}`)
		.setDescription(
			counter === 0
				? 'You couldn\'t even count past zero. smh.'
				: oneLine`${participants.length} ${pluralize('user', participants.length)}
				took ${prettyMilliseconds(timeTaken, { verbose: true })} to count to ${counter}. That's
				an average of one count ever ${prettyMilliseconds(timeTaken / counter, { verbose: true })}.
				${newMax ? 'This is the new maximum count!' : ''}`
		)
		.setColor('Blurple');

	const resultMsg = await msg.channel.send({ embeds: [embed] });

	if (newMax) {
		if (maxPin) {
			const pins = await msg.channel.messages.fetchPinned();
			await pins.get(maxPin)?.unpin();
		}
		resultMsg.pin();
	}

	const newCountData: CountData = {
		counter: 0,
		lastUser: null,
		participants: [],
		max: newMax ? counter : max,
		maxPin: newMax ? resultMsg.id : maxPin,
		started: new Date()
	};

	const newGuild = (await container.db.guilds.findOneAndUpdate(
		{ _id: dbGuild._id },
		{ $set: { count: newCountData } },
		{ returnDocument: 'after' }
	)).value;

	if (!newGuild) {
		msg.channel.send('FIRE! FIRE! SOMETHING BROKE AND IDK WHATS GOING ON!');
		throw new Error('Count failed to update');
	}

	container.client.countChannels.set(msg.channelId, newGuild);

	msg.channel.send('Count restarting...\n0');
}

export function makeChart(data: Collection<string, number>, { name, title }: { name?: string, title?: string}): AttachmentBuilder {
	const imageBuffer = new ChartJSNodeCanvas({
		width: 1000,
		height: 600,
		backgroundColour: '#37393f',
		plugins: {
			requireLegacy: ['chartjs-plugin-datalabels']
		},
		chartCallback: (ChartJS) => {
			ChartJS.defaults.color = 'white';
			ChartJS.defaults.font.size = 26;
		}
	})
		.renderToBufferSync({
			type: 'bar',
			data: {
				labels: Array.from(data.keys()),
				datasets: [{
					data: Array.from(data.values()),
					backgroundColor: '#5865F2'
				}]
			},
			options: {
				layout: {
					padding: 30
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { display: false }
					},
					x: {
						display: false,
						grid: { display: false }
					}
				},
				indexAxis: 'y',
				plugins: {
					legend: { display: false },
					title: { text: title ?? '', display: !!title },
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore ts(2322)
					datalabels: {
						anchor: 'end',
						clamp: true,
						backgroundColor: '#37393f',
						borderRadius: 10
					}
				}
			}
		});

	return new AttachmentBuilder(imageBuffer, { name: `${name ?? 'chart'}.png` })
		.setDescription(`A bar graph${title ? ` titled ${title}` : ''}. The data on the graph is; ${
			data.map((value, key) => `${key}: ${value}`).join(', ')
		}.`);
}

export function chunkCollection<K, V>(col: Collection<K, V>, size: number): Array<Collection<K, V>> {
	const chunks: Collection<K, V>[] = [];
	const colAsArr = Array.from(col.entries());
	while (colAsArr.length) chunks.push(new Collection(colAsArr.splice(0, size)));
	return chunks;
}

export function sendToFile(content: string, { filename, extension = 'txt' }: { filename: string, extension?: string}): AttachmentBuilder {
	return new AttachmentBuilder(Buffer.from(content), { name: `${filename}.${extension}` });
}

export function buildErrorPayload(error: Error): [EmbedBuilder, AttachmentBuilder[]] {
	const embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle(error.name)
		.setTimestamp();
	const files: AttachmentBuilder[] = [];

	if (error.message) {
		if (error.message.length < 1000) {
			embed.setDescription(`\`\`\`\n${error.message}\`\`\``);
		} else {
			embed.setDescription(`Full error message too big\n\`\`\`\n${error.message.slice(0, 950)}...\`\`\``);
			files.push(sendToFile(error.message, { filename: 'ErrorMessage' }));
		}
	}

	if (error.stack) {
		if (error.stack.length < 1000) {
			embed.addFields([{ name: 'Stack Trace', value: `\`\`\`js\n${error.stack}\`\`\``, inline: false }]);
		} else {
			embed.addFields([{ name: 'Stack Trace', value: 'Full stack too big, sent to file.', inline: false }]);
			files.push(sendToFile(error.stack, { filename: 'StackTrace', extension: 'js' }));
		}
	}
	return [embed, files];
}

export function generateSnoozeButtons(userId: string): ActionRowBuilder<ButtonBuilder>[] {
	return [new ActionRowBuilder<ButtonBuilder>()
		.addComponents([
			new ButtonBuilder()
				.setEmoji('💤')
				.setLabel('Snooze')
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(`snooze|${userId}`),
			new ButtonBuilder()
				.setEmoji('✅')
				.setLabel('Done')
				.setStyle(ButtonStyle.Success)
				.setCustomId(`remove all components|${userId}`)
		])];
}

export function splitMessage(text: string): string[] {
	if (text.length <= 2000) {
		return [text];
	}

	const chunks = text.split('\n');
	const messages: string[] = [];
	let current = '';

	chunks.forEach(chunk => {
		if (chunk.length > 2000) {
			throw new RangeError('SPLIT_MAX_LEN');
		}

		if (current.length + chunk.length > 2000) {
			messages.push(current);
			current = '';
		}

		current += `${chunk}\n`;
	});

	return messages.concat(current);
}
