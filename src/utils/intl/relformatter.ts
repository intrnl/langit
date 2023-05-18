const SECOND = 1e3;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = MONTH * 12;

export const format = (time: string | number, base = Date.now()) => {
	const num = typeof time === 'number' ? time : new Date(time).getTime();
	const delta = num - base;

	const [value, unit] = lookup(delta);

	return Math.abs(value).toLocaleString('en', { style: 'unit', unit, unitDisplay: 'narrow' });
};

export const lookup = (delta: number): [value: number, unit: Intl.RelativeTimeFormatUnit] => {
	const abs = Math.abs(delta);

	if (abs < SECOND) {
		return [0, 'second'];
	}

	if (abs < MINUTE) {
		return [Math.trunc(delta / SECOND), 'second'];
	}

	if (abs < HOUR) {
		return [Math.trunc(delta / MINUTE), 'minute'];
	}

	if (abs < DAY) {
		return [Math.trunc(delta / HOUR), 'hour'];
	}

	if (abs < WEEK) {
		return [Math.trunc(delta / DAY), 'day'];
	}

	if (abs < MONTH) {
		return [Math.trunc(delta / WEEK), 'week'];
	}

	if (abs < YEAR) {
		return [Math.trunc(delta / MONTH), 'month'];
	}

	return [Math.trunc(delta / YEAR), 'year'];
};
