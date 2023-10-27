import { createContext } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import type { QueryReturn } from '@intrnl/sq';

export const ListDidContext = createContext<QueryReturn<DID, unknown>>();
