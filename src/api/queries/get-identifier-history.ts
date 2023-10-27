import type { DID } from '@externdefs/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { dequal } from '~/utils/misc.ts';

interface LegacyGenesisOp {
	type: 'create';
	/** did:key */
	signingKey: string;
	/** did:key */
	recoveryKey: string;
	handle: string;
	service: string;
	prev: string | null;
	sig: string;
}

interface Service {
	type: string;
	endpoint: string;
}

interface OperationOp {
	type: 'plc_operation';
	/** did:key[] */
	rotationKeys: string[];
	/** Record<string, did:key> */
	verificationMethods: Record<string, string>;
	alsoKnownAs: string[];
	services: Record<string, Service>;
	prev: string | null;
	sig: string;
}

interface TombstoneOp {
	type: 'plc_tombstone';
	prev: string;
	sig: string;
}

type PlcOperation = LegacyGenesisOp | OperationOp | TombstoneOp;

interface AuditEntry {
	did: DID;
	operation: PlcOperation;
	cid: string;
	nullified?: boolean;
	createdAt: string;
}

export interface IdentifierHistoryEntry {
	knownAs: string[];
	createdAt: string;
}

export interface IdentifierHistory {
	entries: IdentifierHistoryEntry[];
}

export const getIdentifierHistoryKey = (did: DID) => {
	return ['getIdentifierHistory', did] as const;
};
export const getIdentifierHistory: QueryFn<
	IdentifierHistory,
	ReturnType<typeof getIdentifierHistoryKey>
> = async (key) => {
	const [, did] = key;

	const url = `https://plc.directory/${did}/log/audit`;

	const response = await fetch(url);
	const json = (await response.json()) as AuditEntry[];

	const entries: IdentifierHistoryEntry[] = [];
	let current: string[] | null = null;

	for (let idx = 0, len = json.length; idx < len; idx++) {
		const entry = json[idx];

		const operation = entry.operation;
		const type = operation.type;

		if (type === 'plc_operation') {
			const knownAs = operation.alsoKnownAs
				.filter((uri) => uri.startsWith('at://'))
				.map((uri) => uri.slice(5));

			if (!dequal(current, knownAs)) {
				entries.push({ knownAs: (current = knownAs), createdAt: entry.createdAt });
			}
		} else if (type === 'create') {
			const knownAs = [operation.handle];

			if (!dequal(current, knownAs)) {
				entries.push({ knownAs: (current = knownAs), createdAt: entry.createdAt });
			}
		}
	}

	entries.reverse();
	return { entries: entries };
};
