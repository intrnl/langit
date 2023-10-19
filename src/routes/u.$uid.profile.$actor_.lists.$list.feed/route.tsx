import { createEffect, useContext } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import {
	type ListTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import { useParams } from '~/router.ts';

import TimelineList from '~/components/TimelineList.tsx';

import { ProfileListContext } from '../u.$uid.profile.$actor_.lists.$list/context';

const AuthenticatedListFeedPage = () => {
	const [list] = useContext(ProfileListContext)!;

	const params = useParams('/u/:uid/profile/:actor/lists/:list/feed');

	const uid = () => params.uid as DID;

	const listParams = (): ListTimelineParams | undefined => {
		const $list = list();
		if ($list) {
			return { type: 'list', uri: $list.pages[0].list.uri };
		}
	};

	const [timeline, { refetch }] = createQuery({
		key: () => {
			const $listParams = listParams();
			if ($listParams) {
				return getTimelineKey(uid(), $listParams);
			}
		},
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => {
			const $timeline = timeline();
			if ($timeline && $timeline.pages[0].cid) {
				return getTimelineLatestKey(uid(), listParams()!);
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
		<TimelineList
			uid={uid()}
			timeline={timeline}
			latest={latest}
			loading={!list()}
			onLoadMore={(cursor) => refetch(true, cursor)}
			onRefetch={() => refetch(true)}
		/>
	);
};

export default AuthenticatedListFeedPage;
