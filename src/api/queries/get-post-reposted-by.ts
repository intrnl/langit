import { type QueryFn } from '~/lib/solid-query/index.ts';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type PostProfilesListPage } from '../models/profiles-list.ts';

import { type BskyGetRepostedByResponse } from '../types.ts';
import { type Collection, type DID, pushCollection } from '../utils.ts';

import _getDid from './_did.ts';

export const getPostRepostedByKey = (uid: DID, actor: string, post: string, limit: number) =>
	['getPostRepostedBy', uid, actor, post, limit] as const;
export const getPostRepostedBy: QueryFn<
	Collection<PostProfilesListPage>,
	ReturnType<typeof getPostRepostedByKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, actor, post, limit] = key;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor);

	const uri = `at://${did}/app.bsky.feed.post/${post}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getRepostedBy',
		params: { uri, limit, cursor: param },
	});

	const data = response.data as BskyGetRepostedByResponse;
	const page: PostProfilesListPage = {
		cursor: data.cursor,
		profiles: data.repostedBy.map((profile) => mergeSignalizedProfile(profile)),
	};

	return pushCollection(collection, page, param);
};
