import { type SignalizedList } from '../cache/lists.ts';
import { type SignalizedProfile } from '../cache/profiles.ts';

export interface SignalizedListSubject {
	subject: SignalizedProfile;
}

export interface ListsPage {
	cursor?: string;
	lists: SignalizedList[];
}

export interface SubscribedListsPage extends ListsPage {
	remainingLists: SignalizedList[];
}

export interface DetailedListPage {
	cursor?: string;
	items: SignalizedListSubject[];
	list: SignalizedList;
}
