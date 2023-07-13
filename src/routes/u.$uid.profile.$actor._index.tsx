import { createEffect } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import {
	type ProfileTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import { useParams } from '~/router.ts';

import TimelineList from '~/components/TimelineList.tsx';

export interface AuthenticatedProfileTimelinePageProps {
	type?: ProfileTimelineParams['tab'];
}

const AuthenticatedProfileTimelinePage = (props: AuthenticatedProfileTimelinePageProps) => {
	const params = useParams('/u/:uid/profile/:actor');

	const type = () => props.type ?? 'posts';

	const uid = () => params.uid as DID;
	const actor = () => params.actor;

	const feedParams = (): ProfileTimelineParams => ({ type: 'profile', actor: actor(), tab: type() });

	const [timeline, { refetch }] = createQuery({
		key: () => getTimelineKey(uid(), feedParams()),
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => getTimelineLatestKey(uid(), feedParams()),
		fetch: getTimelineLatest,
		staleTime: 10_000,
		refetchInterval: 30_000,
		enabled: () => {
			if (!timeline() || timeline()!.pages.length < 1 || !timeline()!.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	createEffect(() => {
		const $timeline = timeline();

		if ($timeline) {
			const pages = $timeline.pages;
			const length = pages.length;

			if (length === 1) {
				mutateLatest({ cid: pages[0].cid });
			}
		}
	});

	return (
		<TimelineList
			uid={uid()}
			timeline={timeline}
			latest={latest}
			onLoadMore={(cursor) => refetch(true, cursor)}
			onRefetch={() => refetch(true)}
		/>
	);
};

export default AuthenticatedProfileTimelinePage;
