import type { Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { useSearchParams } from '@solidjs/router';

import { useParams } from '~/router.ts';

import SearchInput from '~/components/SearchInput.tsx';
import { Tab } from '~/components/Tab.tsx';

import SearchUsers from './SearchUsers.tsx';

const enum SearchType {
	USERS = 'user',
}

export interface SearchComponentProps {
	uid: DID;
	query: string;
}

const pages: Record<SearchType, Component<SearchComponentProps>> = {
	[SearchType.USERS]: SearchUsers,
};

const AuthenticatedSearchPage = () => {
	const params = useParams('/u/:uid/explore/search');
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string; t?: SearchType }>();

	const type = () => searchParams.t ?? SearchType.USERS;
	const query = () => searchParams.q ?? '';

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-20 bg-background">
				<div class="flex h-13 items-center gap-2 px-4">
					<SearchInput value={query()} onEnter={(next) => setSearchParams({ q: next }, { replace: true })} />
				</div>

				<div class="flex h-13 overflow-x-auto border-b border-divider">
					<Tab component="button" active={type() === SearchType.USERS}>
						Users
					</Tab>
				</div>
			</div>

			<Dynamic component={pages[type()]} uid={params.uid as DID} query={query()} />
		</div>
	);
};

export default AuthenticatedSearchPage;
