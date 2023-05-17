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
	/**
	 * Timeline API provides context to replies in full details, which means that
	 * we can see the same signal being updated multiple times in the course of a
	 * single timeline query, this property allows preventing those needless
	 * updates from happening.
	 */
	$key?: number;

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
	embed?: {
		$type: 'app.bsky.embed.recordWithMedia#view';
		record: {
			record: {
				$type: 'app.bsky.embed.record#viewRecord';
				uri: string;
				cid: string;
				author: BskyPostAuthor;
				value: {
					$type: 'app.bsky.feed.post';
					text: string;
					embed: {
						$type: 'app.bsky.embed.images';
						images: Array<{
							alt: string;
							image: {
								$type: 'blob';
								ref: {
									$link: string;
								};
								mimeType: string;
								size: 800267;
							};
						}>;
					};
					createdAt: string;
				};
				labels: BskyLabel[];
				indexedAt: string;
				embeds: Array<{
					$type: 'app.bsky.embed.images#view';
					images: Array<{
						thumb: string;
						fullsize: string;
						alt: string;
					}>;
				}>;
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
}

export interface BskyThread {
	$type: 'app.bsky.feed.defs#threadViewPost';
	post: BskyPost;
	parent?: BskyThread;
	replies: BskyThread[];
}

export interface BskyTimelinePost {
	post: BskyPost;
	reply?: {
		root: BskyPost;
		parent: BskyPost;
	};
	reason?: { $type: 'app.bsky.feed.defs#reasonRepost'; by: BskyPostAuthor; indexedAt: string };
}

export interface BskyTimeline {
	cursor: string;
	feed: BskyTimelinePost[];
}
