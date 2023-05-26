const formatter = new Intl.NumberFormat('en-US', {
	notation: 'compact',
});

export const format = (value: number) => {
	return formatter.format(value);
};
