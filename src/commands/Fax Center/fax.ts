import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ColorResolvable, Message, AttachmentBuilder, EmbedBuilder, TextChannel, cleanContent } from 'discord.js';
import { createCanvas, loadImage, Image } from 'canvas';
import { SteveCommand } from '@lib/extensions/SteveCommand';

const WIDTH = 750;
const HEIGHT = WIDTH;
const HEADER_HEIGHT = 150;
const FONT_HEIGHT = 35;

@ApplyOptions<CommandOptions>({
	description: 'Send someone a fax!',
	detailedDescription: {
		usage: '<fax number> <message>',
		examples: ['867-5309 Thanks for being awesome!', '01189998819991197253 HELP! FIRE! Help, there is a fire. ~Moss']
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const faxNumber = await args.pick('string');
		const recipient = await this.container.db.users.findOne({ 'fax.number': faxNumber });

		if (!recipient || !recipient.fax?.channel) {
			return send(msg, "Sorry, Lorna doesn't have that number in her rolodex");
		}

		const response = await send(msg, `Dialing ${faxNumber}...`);

		const emojiPromises: Promise<Image>[] = [];

		const cleanMessage = cleanContent(await args.rest('string'), msg.channel).replace(/<a?:[a-zA-Z0-9_-]{2,}:(\d+)>/gm, (_, id) => {
			emojiPromises.push(loadImage(`https://cdn.discordapp.com/emojis/${id}.png?size=32`));
			return '\u0000';
		});

		const messageParts = cleanMessage.split('\u0000');

		const emotes = await Promise.all(emojiPromises);

		const attachments: Array<AttachmentBuilder> = [];

		const canvas = createCanvas(WIDTH, HEIGHT);
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = recipient.fax?.background || '#ffffff';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		ctx.fillStyle = recipient.fax?.text || '#000000';
		ctx.textAlign = 'center';
		ctx.font = '50px serif';
		ctx.fillText('From the desk of', WIDTH / 2, 50);

		ctx.font = '45px serif';
		ctx.fillText(msg.author.username, WIDTH / 2, 100);

		const pfp = await loadImage(msg.author.displayAvatarURL({ forceStatic: true, extension: 'png' }));
		ctx.save();
		ctx.translate((HEADER_HEIGHT / 2) - 50, (HEADER_HEIGHT / 2) - 50);
		ctx.beginPath();
		ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
		ctx.clip();
		ctx.drawImage(pfp, 0, 0, 100, 100);
		ctx.restore();

		ctx.translate((HEADER_HEIGHT / 2) - 25, HEADER_HEIGHT + 25);
		ctx.textAlign = 'left';
		ctx.font = `${FONT_HEIGHT - 5}px serif`;

		let i = 0,
			j = 0,
			spaceLeft = 75,
			currentHeight = HEADER_HEIGHT + 25,
			pageIdx = 1;


		messageParts.forEach((message, emoteIdx) => {
			while (message.length) {
				for (i = message.length; ctx.measureText(message.substring(0, i)).width > WIDTH - spaceLeft; i--);

				let result = message.substring(0, i);

				let addNewLine = false;
				if (result.indexOf('\n') !== -1) {
					result = result.substring(0, result.indexOf('\n') + 1);
					addNewLine = true;
				} else if (i !== message.length) {
					for (j = 0; result.indexOf(' ', j) !== -1; j = result.indexOf(' ', j) + 1);
					result = result.substring(0, j || result.length);
					addNewLine = true;
				}
				ctx.fillText(result, 0, 0);

				if (addNewLine) {
					currentHeight += FONT_HEIGHT;
					ctx.resetTransform();
					ctx.translate((HEADER_HEIGHT / 2) - 25, currentHeight);
					spaceLeft = 75;
				} else {
					const lineWidth = ctx.measureText(result).width;
					ctx.translate(lineWidth, 0);
					spaceLeft -= lineWidth;
				}

				message = message.substring(result.length, message.length);

				if (currentHeight >= HEIGHT - 25) {
					attachments.push(new AttachmentBuilder(canvas.toBuffer(), { name: `page${pageIdx++}.png` }));

					ctx.resetTransform();

					ctx.fillStyle = recipient.fax?.background || '#ffffff';
					ctx.fillRect(0, 0, WIDTH, HEIGHT);

					ctx.fillStyle = recipient.fax?.text || '#000000';
					ctx.translate((HEADER_HEIGHT / 2) - 25, (HEADER_HEIGHT / 2) - 25);
					currentHeight = (HEADER_HEIGHT / 2) - 25;
				}
			}
			if (emotes[emoteIdx]) {
				ctx.drawImage(emotes[emoteIdx], 0, -32);
				ctx.translate(32, 0);
				spaceLeft -= 32;
			}
		});

		attachments.push(new AttachmentBuilder(canvas.toBuffer(), { name: `page${pageIdx++}.png` }));

		if (attachments.length > 10) {
			return response.edit("The fax machine doesn't have enough paper for a fax that long.");
		}

		const embeds = attachments.map((attachment) =>
			new EmbedBuilder()
				.setImage(`attachment://${attachment.name}`)
				.setTimestamp(msg.createdTimestamp)
				.setColor((recipient.embedColor || 0xadcb27) as ColorResolvable)
		);

		const faxDest = (this.container.client.channels.cache.get(recipient.fax.channel)
			|| await this.container.client.channels.fetch(recipient.fax.channel)) as TextChannel;

		await faxDest.send({
			content: `<@${recipient.id}>! I got a fax here for ya darlin`,
			files: attachments,
			embeds
		});

		return response.edit('The fax confirmation just came through. Your message has been delivered.');
	}

}
