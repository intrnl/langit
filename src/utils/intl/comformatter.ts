const formatter = new Intl.NumberFormat('en', {
	notation: 'compact',
});

export const format = (value: number) => {
	return formatter.format(value);
};
