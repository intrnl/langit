import type { ModerationLabelOpts } from '~/api/moderation/types.ts';

export interface FilterPrefs {
	global: ModerationLabelOpts | undefined;
	local: ModerationLabelOpts;
}

export interface LabelType {
	id: string;
	groupId: string;
	name: string;
	description: string;
}

export interface LabelTypeGroup {
	id: string;
	name: string;
	description: string;
	children: LabelType[];
}

export const LABEL_TYPES: LabelTypeGroup[] = [
	// System and Legal groups cannot normally be configured

	// {
	// 	id: 'system',
	// 	name: 'System',
	// 	description: 'Moderator overrides for special cases.',
	// 	children: [],
	// },
	// {
	// 	id: 'legal',
	// 	name: 'Legal',
	// 	description: 'Content removed for legal reasons.',
	// 	children: [],
	// },

	{
		id: 'sexual',
		name: 'Adult content',
		description: 'Content which is sexual in nature.',
		children: [
			{
				id: 'porn',
				groupId: 'sexual',
				name: 'Pornography',
				description:
					'Images of full-frontal nudity (genitalia) in any sexualized context, or explicit sexual activity (meaning contact with genitalia or breasts) even if partially covered. Includes graphic sexual cartoons (often jokes/memes).',
			},
			{
				id: 'sexual',
				groupId: 'sexual',
				name: 'Sexually suggestive',
				description:
					'Content that does not meet the level of "pornography", but is still sexual. Some common examples have been selfies and "hornyposting" with underwear on, or partially naked (naked but covered, eg with hands or from side perspective). Sheer/see-through nipples may end up in this category.',
			},
			{
				id: 'nudity',
				groupId: 'sexual',
				name: 'Nudity',
				description:
					'Nudity which is not sexual, or that is primarily "artistic" in nature. For example: breastfeeding; classic art paintings and sculptures; newspaper images with some nudity; fashion modeling. "Erotic photography" is likely to end up in sexual or porn.',
			},
		],
	},

	{
		id: 'violence',
		name: 'Violence',
		description: 'Content which is violent or deeply disturbing.',
		children: [
			{
				id: 'nsfl',
				groupId: 'violence',
				name: 'NSFL',
				description:
					'"Not Suitable For Life." This includes graphic images like the infamous "goatse" (don\'t look it up).',
			},
			{
				id: 'corpse',
				groupId: 'violence',
				name: 'Corpse',
				description:
					'Visual image of a dead human body in any context. Includes war images, hanging, funeral caskets. Does not include all figurative cases (cartoons), but can include realistic figurative images or renderings.',
			},
			{
				id: 'gore',
				groupId: 'violence',
				name: 'Gore',
				description: 'Intended for shocking images, typically involving blood or visible wounds.',
			},
			{
				id: 'torture',
				groupId: 'violence',
				name: 'Torture',
				description: 'Depictions of torture of a human or animal (animal cruelty).',
			},
			{
				id: 'self-harm',
				groupId: 'violence',
				name: 'Self-harm',
				description: 'A visual depiction (photo or figurative) of cutting, suicide, or similar.',
			},
		],
	},

	{
		id: 'intolerance',
		name: 'Intolerance',
		description: 'Content or behavior which is hateful or intolerant toward a group of people.',
		children: [
			{
				id: 'intolerant-race',
				groupId: 'intolerance',
				name: 'Racial intolerance',
				description: 'Hateful or intolerant content related to race.',
			},
			{
				id: 'intolerant-gender',
				groupId: 'intolerance',
				name: 'Gender intolerance',
				description: 'Hateful or intolerant content related to gender or gender identity.',
			},
			{
				id: 'intolerant-sexual-orientation',
				groupId: 'intolerance',
				name: 'Sexual orientation intolerance',
				description: 'Hateful or intolerant content related to sexual preferences.',
			},
			{
				id: 'intolerant-religion',
				groupId: 'intolerance',
				name: 'Religious intolerance',
				description: 'Hateful or intolerant content related to religious views or practices.',
			},
			{
				id: 'intolerant',
				groupId: 'intolerance',
				name: 'Intolerance',
				description: 'A catchall for hateful or intolerant content which is not covered elsewhere.',
			},
			{
				id: 'icon-intolerant',
				groupId: 'intolerance',
				name: 'Intolerant iconography',
				description:
					'Visual imagery associated with a hate group, such as the KKK or Nazi, in any context (supportive, critical, documentary, etc).',
			},
		],
	},

	{
		id: 'rude',
		name: 'Rude',
		description: 'Behavior which is rude toward other users.',
		children: [
			{
				id: 'threat',
				groupId: 'rude',
				name: 'Threats',
				description: 'Statements or imagery published with the intent to threaten, intimidate, or harm.',
			},
		],
	},

	{
		id: 'curation',
		name: 'Curational',
		description: 'Subjective moderation geared towards curating a more positive environment.',
		children: [
			{
				id: 'spoiler',
				groupId: 'curation',
				name: 'Spoiler',
				description: 'Discussion about film, TV, etc which gives away plot points.',
			},
		],
	},

	{
		id: 'spam',
		name: 'Spam',
		description: "Content which doesn't add to the conversation.",
		children: [
			{
				id: 'spam',
				groupId: 'spam',
				name: 'Spam',
				description:
					'Repeat, low-quality messages which are clearly not designed to add to a conversation or space.',
			},
		],
	},

	{
		id: 'misinfo',
		name: 'Misinformation',
		description: 'Content which misleads or defrauds users.',
		children: [
			{
				id: 'account-security',
				groupId: 'misinfo',
				name: 'Security concerns',
				description: 'Content designed to hijack user accounts such as a phishing attack.',
			},
			{
				id: 'net-abuse',
				groupId: 'misinfo',
				name: 'Network attacks',
				description: 'Content designed to attack network systems such as denial-of-service attacks.',
			},
			{
				id: 'impersonation',
				groupId: 'misinfo',
				name: 'Impersonation',
				description: 'Accounts which falsely assert some identity.',
			},
			{
				id: 'scam',
				groupId: 'misinfo',
				name: 'Scam',
				description: 'Fraudulent content.',
			},
		],
	},
];
