const formatter = new Intl.NumberFormat('en-US', {
	notation: 'compact',
});

export const format = (value: number) => {
	if (value < 1_000) {
		return '' + value;
	}

	return formatter.format(value);
};
