const SECOND = 1e3;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = MONTH * 12;

const BYTE = 1;
const KILOBYTE = BYTE * 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

export const format = (time: string | number, base = new Date()) => {
	const date = new Date(time);
	const num = date.getTime();
	const delta = Math.abs(num - base.getTime());

	if (delta > WEEK) {
		return dateFormat.format(date);
	}

	const [value, unit] = lookupReltime(delta);

	return Math.abs(value).toLocaleString('en-US', { style: 'unit', unit, unitDisplay: 'narrow' });
};

export const formatSize = (size: number) => {
	let num = size;
	let fractions = 0;
	let unit: string;

	if (size < KILOBYTE) {
		unit = 'byte';
	} else if (size < MEGABYTE) {
		num /= KILOBYTE;
		unit = 'kilobyte';
	} else if (size < GIGABYTE) {
		num /= MEGABYTE;
		unit = 'megabyte';
	} else {
		num /= GIGABYTE;
		unit = 'gigabyte';
	}

	if (num > 100) {
		fractions = 1;
	} else if (num > 10) {
		fractions = 2;
	} else if (num > 1) {
		fractions = 3;
	}

	return num.toLocaleString('en-US', {
		style: 'unit',
		unit: unit,
		unitDisplay: 'short',
		maximumFractionDigits: fractions,
	});
};

export const lookupReltime = (delta: number): [value: number, unit: Intl.RelativeTimeFormatUnit] => {
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
