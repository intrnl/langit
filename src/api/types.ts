import { type ReadonlySignal } from '~/utils/signals';

export interface BskyLabel {
	cts: string;
	neg: false;
	src: string;
	uri: string;
	val: string;
}

export interface BskyProfile {
	did: string;
	handle: string;
	displayName: string;
	description: string;
	avatar?: string;
	banner?: string;
	followersCount: number;
	followsCount: number;
	postsCount: number;
	indexedAt: string;
	labels: BskyLabel[];
	viewer: {
		muted: boolean;
		blockedBy: boolean;
		following?: string;
	};
}

export interface BskyPostAuthor {
	did: string;
	handle: string;
	displayName: string;
	avatar?: string;
	viewer: {
		muted: boolean;
		blockedBy: boolean;
		following?: string;
	};
	labels: BskyLabel[];
}

export interface BskyPost {
	uri: string;
	cid: string;
	author: BskyPostAuthor;
	record: {
		$type: 'app.bsky.feed.post';
		text: string;
		facets: any[];
		createdAt: string;
		reply?: {
			root: {
				cid: string;
				uri: string;
			};
			parent: {
				cid: string;
				uri: string;
			};
		};
	};
	replyCount: number;
	repostCount: number;
	likeCount: number;
	indexedAt: string;
	labels: BskyLabel[];
	viewer: {
		like?: string;
		repost?: string;
	};

	$renderedContent: ReadonlySignal<any>;
}

export interface BskyThread {
	$type: 'app.bsky.feed.defs#threadViewPost';
	post: BskyPost;
	parent?: BskyThread;
	replies: BskyThread[];
}
