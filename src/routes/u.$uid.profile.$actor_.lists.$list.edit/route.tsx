import { Match, Switch, createMemo } from 'solid-js';

import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';
import { createMutation, createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';

import { lists } from '~/api/cache/lists.ts';
import { getList, getListKey } from '~/api/queries/get-list.ts';

import { getCurrentDate, getRecordId, isDid } from '~/api/utils.ts';

import { multiagent } from '~/globals/agent.ts';
import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import ListForm, { type ListSubmissionData } from '../u.$uid.you.moderation.lists.self.new/ListForm.tsx';
import { uploadBlob } from '~/api/mutations/upload-blob.ts';

type ListRecord = Records['app.bsky.graph.list'];

const AuthenticatedListsEditPage = () => {
	const params = useParams('/u/:uid/profile/:actor/lists/:list/edit');

	const uid = () => params.uid as DID;

	const [listing, { refetch }] = createQuery({
		// we're not interested in the actual members, but 1 is the minimum we can
		// request from this endpoint.
		key: () => getListKey(uid(), params.actor, params.list, 1),
		fetch: getList,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		initialData: (key) => {
			const [, uid, actor, list] = key;

			if (isDid(actor)) {
				const uri = `at://${actor}/app.bsky.graph.list/${list}`;
				const key = uid + '|' + uri;

				const ref = lists[key];
				const data = ref?.deref();

				if (data) {
					return {
						data: {
							pages: [{ list: data, items: [], cursor: undefined }],
							params: [undefined],
						},
					};
				}
			}
		},
	});

	const list = createMemo(() => {
		return listing()?.pages[0].list;
	});

	const mutation = createMutation({
		mutate: async (data: ListSubmissionData) => {
			const { avatar, name, purpose, description, descriptionFacets } = data;

			const rkey = getRecordId(list()!.uri);
			const $uid = uid();

			const agent = await multiagent.connect($uid);

			let prev: ListRecord | undefined;
			let swap: string | undefined;

			try {
				const response = await agent.rpc.get('com.atproto.repo.getRecord', {
					params: {
						collection: 'app.bsky.graph.list',
						repo: $uid,
						rkey: rkey,
					},
				});

				const data = response.data;

				prev = data.value as any;
				swap = data.cid;
			} catch {}

			const record: ListRecord = {
				createdAt: prev?.createdAt || getCurrentDate(),
				avatar:
					avatar === undefined
						? undefined
						: avatar instanceof Blob
						? ((avatar as any).$blob ||= await uploadBlob($uid, avatar))
						: prev?.avatar,
				name: name,
				purpose: purpose,
				description: description,
				descriptionFacets: descriptionFacets,
			};

			await agent.rpc.call('com.atproto.repo.putRecord', {
				data: {
					collection: 'app.bsky.graph.list',
					repo: $uid,
					rkey: rkey,
					swapRecord: swap,
					record: record,
				},
			});
		},
		onSuccess: () => {
			return refetch(true);
		},
	});

	const renderTitle = () => {
		const $list = list();

		if ($list) {
			return `Edit "${$list.name.value}" list / Langit`;
		}

		return `Edit list / Langit`;
	};

	const isInvalidEdit = () => {
		const $list = list();
		return $list ? $list.creator.did !== uid() : false;
	};

	return (
		<div>
			<Title>{renderTitle()}</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Edit user list</p>
			</div>

			<Switch>
				<Match when={listing.error || isInvalidEdit()} keyed>
					{(_true) => (
						<div class="grid grow place-items-center">
							<div class="max-w-sm p-4">
								<h1 class="mb-1 text-xl font-bold">Failed to load</h1>
								<p class="break-words text-sm">
									{(() => {
										const $error = listing.error;

										if ($error) {
											return $error instanceof XRPCError ? $error.message : '' + $error;
										}

										return `Invalid request`;
									})()}
								</p>
							</div>
						</div>
					)}
				</Match>

				<Match when={list()}>
					{(list) => (
						<ListForm
							disabled={listing.loading || mutation.isLoading}
							initialData={list()}
							onSubmit={(next) => mutation.mutate(next)}
						/>
					)}
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedListsEditPage;
