import { createQuery } from '@intrnl/sq';

import { getTimeline, getTimelineKey } from '~/api/queries/get-timeline.ts';

import TimelineList from '~/components/TimelineList.tsx';

import type { SearchComponentProps } from './route.tsx';

const SearchPosts = (props: SearchComponentProps) => {
	const uid = () => props.uid;

	const [posts, { refetch }] = createQuery({
		key: () => getTimelineKey(uid(), { type: 'search', query: props.query }),
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<TimelineList
			uid={uid()}
			timeline={posts}
			onLoadMore={(cursor) => refetch(true, cursor)}
			// This function doesn't need to be implemented as we're not passing a latest query
			onRefetch={() => {}}
		/>
	);
};

export default SearchPosts;
