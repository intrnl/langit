export let graphemeLen: (text: string) => number;

if (Intl.Segmenter) {
	const segmenter = new Intl.Segmenter();

	graphemeLen = (text) => {
		const segments = Array.from(segmenter.segment(text));
		return segments.length;
	};
} else {
	console.log('Intl.Segmenter API not available, falling back to polyfill...');

	const { countGraphemes } = await import('./graphemer.ts');
	graphemeLen = countGraphemes;
}
