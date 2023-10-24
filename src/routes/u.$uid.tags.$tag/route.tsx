import { createEffect } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import {
	type TagTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import TimelineList from '~/components/TimelineList.tsx';

const AuthenticatedTagFeedPage = () => {
	const params = useParams('/u/:uid/tags/:tag');

	const uid = () => params.uid as DID;
	const tag = () => params.tag;

	const feedParams = (): TagTimelineParams => {
		return { type: 'tag', tag: tag().toLowerCase(), sort: 'new' };
	};

	const [timeline, { refetch }] = createQuery({
		key: () => getTimelineKey(uid(), feedParams()),
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => {
			const $timeline = timeline();
			if ($timeline && $timeline.pages[0].cid) {
				return getTimelineLatestKey(uid(), feedParams());
			}
		},
		fetch: getTimelineLatest,
		staleTime: 10_000,
		refetchInterval: 30_000,
	});

	createEffect((prev: ReturnType<typeof timeline> | 0) => {
		const next = timeline();

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			if (length === 1) {
				mutateLatest({ cid: pages[0].cid });
			}
		}

		return next;
	}, 0 as const);

	return (
		<div class="flex grow flex-col">
			<Title render={() => `#${tag()} / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center justify-between gap-4 border-b border-divider bg-background px-4">
				<p class="text-base font-bold">#{tag()}</p>
			</div>

			<TimelineList
				uid={uid()}
				timeline={timeline}
				latest={latest}
				onLoadMore={(cursor) => refetch(true, cursor)}
				onRefetch={() => refetch(true)}
			/>
		</div>
	);
};

export default AuthenticatedTagFeedPage;
