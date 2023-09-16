import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import {
	type ListType,
	getSubscribedLists,
	getSubscribedListsKey,
} from '~/api/queries/get-subscribed-lists.ts';

import ListList from '~/components/ListList.tsx';

export interface SubscribedListsProps {
	uid: DID;
	type: ListType;
}

const SubscribedLists = (props: SubscribedListsProps) => {
	const uid = () => props.uid;
	const type = () => props.type;

	const [lists, { refetch }] = createQuery({
		key: () => getSubscribedListsKey(uid(), type()),
		fetch: getSubscribedLists,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<ListList
			uid={uid()}
			list={lists}
			fallback={
				<div class="p-4 text-sm text-muted-fg">
					User lists created by other users will show up here once you subscribe to them.
				</div>
			}
			onLoadMore={(cursor) => refetch(true, cursor)}
		/>
	);
};

export default SubscribedLists;
