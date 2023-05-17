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

export interface BskyPostRecordEmbed {
	images: Array<{
		alt: string;
		image: {
			$type: 'blob';
			ref: {
				$link: string;
			};
			mimeType: string;
			size: number;
		};
	}>;
	record: {
		cid: string;
		uri: string;
	};
}

export interface BskyPostEmbed {
	images: Array<{
		thumb: string;
		fullsize: string;
		alt: string;
	}>;
	record: {
		/** If `images` is present then you need to access `embed.record.record` */
		record?: BskyPostEmbed['record'];

		$type: 'app.bsky.embed.record#viewRecord';
		uri: string;
		cid: string;
		author: BskyPostAuthor;
		embeds: [];
		indexedAt: string;
		labels: BskyLabel[];
		value: {
			$type: 'app.bsky.feed.post';
			text: string;
			createdAt: string;
		};
	};
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
		embed?: BskyPostRecordEmbed;
	};
	embed?: BskyPostEmbed;
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
