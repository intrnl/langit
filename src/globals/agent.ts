import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { type MultiagentAccountData, Multiagent } from '~/api/multiagent.ts';

export const multiagent = new Multiagent('store');

export const getAccountData = (uid: DID): MultiagentAccountData | undefined => {
	return multiagent.accounts[uid];
};
