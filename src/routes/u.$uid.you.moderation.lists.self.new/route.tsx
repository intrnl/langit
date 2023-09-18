import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';
import { createMutation } from '@intrnl/sq';
import { Title } from '@solidjs/meta';

import { uploadBlob } from '~/api/mutations/upload-blob.ts';
import { getCurrentDate, getRecordId } from '~/api/utils.ts';

import { multiagent } from '~/globals/agent.ts';

import { assert } from '~/utils/misc.ts';
import { useNavigate, useParams } from '~/router.ts';

import ListForm, { type ListSubmissionData } from './ListForm.tsx';

type ListRecord = Records['app.bsky.graph.list'];

const AuthenticatedAddListsModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/lists/self/new');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const mutation = createMutation({
		mutate: async (data: ListSubmissionData) => {
			const { avatar, name, purpose, description, descriptionFacets } = data;
			const $uid = uid();

			assert(typeof avatar !== 'string');

			const record: ListRecord = {
				createdAt: getCurrentDate(),
				avatar: avatar ? ((avatar as any).$blob ||= await uploadBlob($uid, avatar)) : undefined,
				name: name,
				purpose: purpose,
				description: description,
				descriptionFacets: descriptionFacets,
			};

			const agent = await multiagent.connect($uid);

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: $uid,
					collection: 'app.bsky.graph.list',
					record: record,
				},
			});

			return { uid: $uid, ...response.data };
		},
		onSuccess: ({ uid, uri }) => {
			navigate('/u/:uid/profile/:actor/lists/:list', {
				replace: true,
				params: {
					uid: uid,
					actor: uid,
					list: getRecordId(uri),
				},
			});
		},
	});

	return (
		<div>
			<Title>New user list / Langit</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">New user list</p>
			</div>

			<ListForm disabled={mutation.isLoading} onSubmit={(next) => mutation.mutate(next)} />
		</div>
	);
};

export default AuthenticatedAddListsModerationPage;
