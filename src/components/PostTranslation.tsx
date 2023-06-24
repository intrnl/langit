import { Match, Switch } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { languageNames } from '~/utils/intl/displaynames.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';

export interface PostTranslationProps {
	target?: string;
	text: string;
}

interface TranslationResult {
	state: 'TRANSLATED';
	result: string;
	source: string[];
}

const PostTranslation = (props: PostTranslationProps) => {
	const query = createQuery({
		queryKey: () => ['getTranslation', props.target, props.text] as const,
		queryFn: async (ctx) => {
			const [, target = navigator.language, text] = ctx.queryKey;

			const url = new URL(`/api/translate`, location.href);
			url.searchParams.set('sl', 'auto');
			url.searchParams.set('tl', target);
			url.searchParams.set('text', text);

			const response = await fetch(url);
			const json = await response.json();

			if (!response.ok) {
				throw new Error(`Received ${response.status}: ${json.state}`);
			}

			return json as TranslationResult;
		},
		staleTime: Infinity,
	});

	return (
		<div class="mt-3">
			<Switch>
				<Match when={query.isLoading}>
					<div class="flex justify-center p-2">
						<CircularProgress />
					</div>
				</Match>

				<Match when={query.error}>
					{(err) => (
						<div class="flex flex-col items-center gap-2 p-2">
							<p class="text-center text-sm text-muted-fg">Unable to retrieve translation</p>

							<div>
								<button onClick={() => query.refetch()} class={/* @once */ button({ color: 'primary' })}>
									Retry
								</button>
							</div>
						</div>
					)}
				</Match>

				<Match when={query.data}>
					{(data) => (
						<>
							<p class="text-sm text-muted-fg">
								Translated from{' '}
								{data()
									.source.map((code) => languageNames.of(code))
									.join(', ')}
							</p>
							<p class="whitespace-pre-wrap break-words text-base">{data().result}</p>
						</>
					)}
				</Match>
			</Switch>
		</div>
	);
};

export default PostTranslation;
