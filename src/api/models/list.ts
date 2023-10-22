import type { SignalizedList } from '../cache/lists.ts';
import type { SignalizedProfile } from '../cache/profiles.ts';

export interface SignalizedListSubject {
	subject: SignalizedProfile;
}

export interface ListsPage {
	cursor?: string;
	lists: SignalizedList[];
}

export interface SubscribedListsPageCursor {
	key: string | null;
	remaining: SignalizedList[];
}

export interface SubscribedListsPage {
	cursor?: SubscribedListsPageCursor;
	lists: SignalizedList[];
}

export interface DetailedListPage {
	cursor?: string;
	items: SignalizedListSubject[];
	list: SignalizedList;
}
