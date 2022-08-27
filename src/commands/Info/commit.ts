import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandOptions, UserError } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { execSync } from 'child_process';
import { send } from '@sapphire/plugin-editable-commands';
import { readFileSync } from 'fs';
import { dateToTimestamp, pluralize } from '@lib/utils';
import { oneLine } from 'common-tags';

interface Commit {
	hash: string;
	author: string;
	message: string;
	timestamp: Date;
}

interface GitInfo {
	branch: string;
	commits: Array<Commit>;
}

@ApplyOptions<CommandOptions>({
	description: 'See recent commit history',
	detailedDescription: {
		extendedHelp: 'Merges are not shown'
	},
	options: ['count', 'c', 'skip', 's']
})
export class CommitCommand extends SteveCommand {

	private homePage = JSON.parse(readFileSync(`${process.cwd()}/package.json`).toString()).homepage;

	public async messageRun(msg: Message, args: Args) {
		const count = parseInt(args.getOption('count', 'c').unwrapOr('10')) || 10;
		const skip = parseInt(args.getOption('skip', 's').unwrapOr('0')) || 0;

		const { branch, commits } = this.getCommits(count, skip);

		if (count <= 0 || skip < 0 || count > 50) {
			throw new UserError({
				identifier: 'InvalidOptions',
				message: 'Sorry but I couldn\'t make sense of the options you gave. Count must be between 1 and 50 and skip can\'t be negative.'
			});
		}

		const descriptions: string[] = [];

		commits.forEach(({ hash, author, message, timestamp }) => {
			descriptions.push(oneLine`[${hash.substring(0, 8)}](${this.homePage}/commit/${hash}):
			\`${message}\` by ${author} at ${dateToTimestamp(timestamp, 'f')}`);
		});

		const embed = new MessageEmbed()
			.setTitle(`Showing ${count} ${pluralize('commit', count)} on ${branch}`)
			.setURL(`${this.homePage}/tree/${branch}`)
			.setDescription(descriptions.join('\n'))
			.setColor('AQUA');


		return send(msg, { embeds: [embed] });
	}

	private getCommits(count = 1, skip = 0): GitInfo {
		const branch = execSync(`cd ${__dirname} && git branch`).toString().split('\n')[0].substring(2).trim();

		const commits: Commit[] = [];

		for (let i = 0; i < count; i++) {
			const [hash, author, message, rawTimestamp] = execSync(oneLine`cd ${__dirname} && git log --max-count=1
				--skip=${skip + i} --no-merges --format="%H%n%an%n%s%n%ci"`).toString().split('\n');

			commits.push({
				hash,
				author,
				message,
				timestamp: new Date(rawTimestamp)
			});
		}

		return { branch, commits };
	}

}
