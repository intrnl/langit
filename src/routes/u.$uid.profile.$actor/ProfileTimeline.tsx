import { type Accessor, createEffect } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import {
	type ProfileTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import TimelineList from '~/components/TimelineList.tsx';

export interface ProfileTimelineProps {
	uid: Accessor<DID>;
	profile: Accessor<SignalizedProfile>;
	tab: ProfileTimelineParams['tab'];
}

const ProfileTimeline = ({ uid, profile, tab }: ProfileTimelineProps) => {
	const params = (): ProfileTimelineParams => ({ type: 'profile', actor: profile().did, tab: tab });

	const [timeline, { refetch }] = createQuery({
		key: () => getTimelineKey(uid(), params()),
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => getTimelineLatestKey(uid(), params()),
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
			timelineDid={profile().did}
			onLoadMore={(cursor) => refetch(true, cursor)}
			onRefetch={() => refetch(true)}
		/>
	);
};

export default ProfileTimeline;
