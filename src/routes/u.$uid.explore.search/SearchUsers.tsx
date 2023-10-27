import { createQuery } from '@intrnl/sq';

import { searchProfiles, searchProfilesKey } from '~/api/queries/search-profiles.ts';

import ProfileList, { renderFollowAccessory } from '~/components/ProfileList.tsx';

import type { SearchComponentProps } from './route.tsx';

const SearchUsers = (props: SearchComponentProps) => {
	const uid = () => props.uid;

	const [profiles, { refetch }] = createQuery({
		key: () => searchProfilesKey(uid(), props.query),
		fetch: searchProfiles,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<ProfileList
			uid={uid()}
			list={profiles}
			renderAccessory={renderFollowAccessory}
			onLoadMore={(cursor) => refetch(true, cursor)}
		/>
	);
};

export default SearchUsers;
