const SECOND = 1e3;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = MONTH * 12;

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'long' });

export const format = (time: string | number, base = new Date()) => {
	const date = new Date(time);
	const num = date.getTime();
	const delta = Math.abs(num - base.getTime());

	if (delta > WEEK) {
		return dateFormat.format(date);
	}

	const [value, unit] = lookup(delta);

	return Math.abs(value).toLocaleString('en', { style: 'unit', unit, unitDisplay: 'narrow' });
};

export const lookup = (delta: number): [value: number, unit: Intl.RelativeTimeFormatUnit] => {
	if (delta < SECOND) {
		return [0, 'second'];
	}

	if (delta < MINUTE) {
		return [Math.trunc(delta / SECOND), 'second'];
	}

	if (delta < HOUR) {
		return [Math.trunc(delta / MINUTE), 'minute'];
	}

	if (delta < DAY) {
		return [Math.trunc(delta / HOUR), 'hour'];
	}

	if (delta < WEEK) {
		return [Math.trunc(delta / DAY), 'day'];
	}

	if (delta < MONTH) {
		return [Math.trunc(delta / WEEK), 'week'];
	}

	if (delta < YEAR) {
		return [Math.trunc(delta / MONTH), 'month'];
	}

	return [Math.trunc(delta / YEAR), 'year'];
};
