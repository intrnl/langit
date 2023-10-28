import { createQuery } from '@intrnl/sq';

import { searchProfiles, searchProfilesKey } from '~/api/queries/search-profiles.ts';

import { ProfileFollowAccessory } from '~/components/lists/ProfileItem.tsx';
import ProfileList from '~/components/lists/ProfileList.tsx';

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
			asideAccessory={ProfileFollowAccessory}
			onLoadMore={(cursor) => refetch(true, cursor)}
		/>
	);
};

export default SearchUsers;
