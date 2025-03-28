import { Result } from '@sapphire/framework';
import { Duration } from 'luxon';

export function resolveDuration(parameter: string): Result<Duration, 'InvalidDuration'> {
	const yearsRegex = /(?<years>\d+)\s?(?:(?:years?)|y)/i;
	const quartersRegex = /(?<quarters>\d+)\s?(?:(?:quarters?)|q)/i;
	const monthsRegex = /(?<months>\d+)\s?(?:(?:months?)|mo)/i;
	const weeksRegex = /(?<weeks>\d+)\s?(?:(?:weeks?)|w)/i;
	const daysRegex = /(?<days>\d+)\s?(?:(?:days?)|d)/i;
	const hoursRegex = /(?<hours>\d+)\s?(?:(?:hours?)|h)/i;
	const minutesRegex = /(?<minutes>\d+)\s?(?:(?:minutes?)|m(?!o))/i;
	const secondsRegex = /(?<seconds>\d+)\s?(?:(?:seconds?)|s)/i;

	const yearString = yearsRegex.exec(parameter)?.groups?.years;
	const quarterString = quartersRegex.exec(parameter)?.groups?.quarters;
	const monthString = monthsRegex.exec(parameter)?.groups?.months;
	const weekString = weeksRegex.exec(parameter)?.groups?.weeks;
	const dayString = daysRegex.exec(parameter)?.groups?.days;
	const hourString = hoursRegex.exec(parameter)?.groups?.hours;
	const minuteString = minutesRegex.exec(parameter)?.groups?.minutes;
	const secondString = secondsRegex.exec(parameter)?.groups?.seconds;

	const duration = Duration.fromObject({
		years: yearString ? parseInt(yearString) : undefined,
		quarters: quarterString ? parseInt(quarterString) : undefined,
		months: monthString ? parseInt(monthString) : undefined,
		weeks: weekString ? parseInt(weekString) : undefined,
		days: dayString ? parseInt(dayString) : undefined,
		hours: hourString ? parseInt(hourString) : undefined,
		minutes: minuteString ? parseInt(minuteString) : undefined,
		seconds: secondString ? parseInt(secondString) : undefined
	});

	if (!duration.isValid || duration.valueOf() === 0) {
		return Result.err('InvalidDuration');
	}

	return Result.ok(duration);
}
