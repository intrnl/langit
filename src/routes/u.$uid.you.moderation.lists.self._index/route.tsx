import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';

import { generatePath, useParams } from '~/router.ts';

import ListList from '~/components/lists/ListList.tsx';

import AddIcon from '~/icons/baseline-add.tsx';

const AuthenticatedListsSelfModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/lists/self');

	const uid = () => params.uid as DID;

	const [lists, { refetch }] = createQuery({
		key: () => getProfileListsKey(uid(), uid()),
		fetch: getProfileLists,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Your user lists</p>

				<div class="grow" />

				<a
					link
					title="New user list"
					href={generatePath('/u/:uid/you/moderation/lists/self/new', params)}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary"
				>
					<AddIcon />
				</a>
			</div>

			<ListList
				uid={uid()}
				list={lists}
				fallback={<div class="p-4 text-sm text-muted-fg">User lists you've created will show up here.</div>}
				onLoadMore={(cursor) => refetch(true, cursor)}
			/>
		</div>
	);
};

export default AuthenticatedListsSelfModerationPage;
