import { container } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { createCanvas } from 'canvas';
import { oneLine } from 'common-tags';
import { AnyChannel, Collection, ColorResolvable, Guild, Message, MessageAttachment, MessageEmbed, User } from 'discord.js';
import type { WithId } from 'mongodb';
import prettyMilliseconds from 'pretty-ms';
import { RandomLoadingMessage } from '@lib/constants';
import type { Reminder, DbUser, CountData } from '@lib/types/database';


export function pickRandom<T>(array: readonly T[]): T {
	const { length } = array;
	return array[Math.floor(Math.random() * length)];
}

export function sendLoadingMessage(message: Message): Promise<typeof message> {
	return send(message, pickRandom(RandomLoadingMessage));
}

export type TimestampType = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export function dateToTimestamp(date: Date, type: TimestampType = 't'): string {
	return `<t:${Math.round(date.valueOf() / 1e3)}:${type}>`;
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
): Promise<AnyChannel | null> {
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

export function makeColorEmbed(color: ColorResolvable): MessageEmbed {
	return new MessageEmbed()
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

	const embed = new MessageEmbed()
		.setTitle(`The count has ended at ${counter}`)
		.setDescription(
			counter === 0
				? 'You couldn\'t even count past zero. smh.'
				: oneLine`${participants.length} ${pluralize('user', participants.length)}
				took ${prettyMilliseconds(timeTaken, { verbose: true })} to count to ${counter}. That's
				an average of one count ever ${prettyMilliseconds(timeTaken / counter, { verbose: true })}.
				${newMax ? 'This is the new maximum count!' : ''}`
		)
		.setColor('BLURPLE');

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

export function makeChart(data: Collection<string, number>, { name, title }: { name?: string, title?: string}): MessageAttachment {
	const canvas = createCanvas(1000, 600);
	const context = canvas.getContext('2d');

	const displayChart = new Chart(context, {
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
				datalabels: {
					anchor: 'end',
					clamp: true,
					backgroundColor: '#37393f',
					borderRadius: 10
				}
			}
		},
		plugins: [
			ChartDataLabels,
			{
				id: 'custom_canvas_background_color',
				beforeDraw: (chart) => {
					const ctx = chart.canvas.getContext('2d');
					if (!ctx) return;
					ctx.save();
					ctx.globalCompositeOperation = 'destination-over';
					ctx.fillStyle = '#37393f';
					ctx.fillRect(0, 0, chart.width, chart.height);
					ctx.restore();
				}
			}
		]
	});
	displayChart.render();

	return new MessageAttachment(canvas.toBuffer(), `${name ?? 'chart'}.png`)
		.setDescription(`A bar graph${title ? ` titled ${title}` : ''}. The data on the graph is; ${
			data.map((value, key) => `${key}: ${value}`).join(', ')
		}.`);
}
