import { Match, Show, Switch, createSignal } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import type { AtUri, DID, RefOf, UnionOf } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, useModalState } from '~/globals/modals.tsx';
import { assert, model } from '~/utils/misc.ts';

import button from '~/styles/primitives/button.ts';
import textarea from '~/styles/primitives/textarea.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import * as menu from '~/styles/primitives/menu.ts';

import CheckIcon from '~/icons/baseline-check';
import { createMutation } from '@intrnl/sq';

export const REPORT_POST = 1; // 1 << 0
export const REPORT_PROFILE = 2; // 1 << 1

export type ReportMessage =
	| { type: typeof REPORT_POST; uri: AtUri; cid: string }
	| { type: typeof REPORT_PROFILE; did: DID };

interface ReportOption {
	label: number;
	value: RefOf<'com.atproto.moderation.defs#reasonType'>;
	name: string;
	desc: string;
}

const options: ReportOption[] = [
	{
		label: REPORT_PROFILE,
		value: 'com.atproto.moderation.defs#reasonMisleading',
		name: 'Misleading profile',
		desc: 'False claims about identity or affiliation',
	},
	{
		label: REPORT_PROFILE,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Community standards violation',
		desc: 'Profile uses terms that violate community standards',
	},

	{
		label: REPORT_POST,
		value: 'com.atproto.moderation.defs#reasonSexual',
		name: 'Unwanted sexual content',
		desc: 'Nudity or pornography not labeled as such',
	},
	{
		label: REPORT_POST,
		value: 'com.atproto.moderation.defs#reasonRude',
		name: 'Anti-social behavior',
		desc: 'Harassment, trolling or intolerance',
	},
	{
		label: REPORT_POST,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Illegal and urgent',
		desc: 'Glaring violations of law or terms of service',
	},
	{
		label: REPORT_POST,
		value: 'com.atproto.moderation.defs#reasonOther',
		name: 'Other issues',
		desc: 'Issues not covered by the options above',
	},

	{
		label: REPORT_POST | REPORT_PROFILE,
		value: 'com.atproto.moderation.defs#reasonSpam',
		name: 'Spam',
		desc: 'Excessive mentions or replies',
	},
];

export interface ReportDialogProps {
	uid: DID;
	report: ReportMessage;
}

const enum ReportStep {
	CHOOSE,
	EXPLAIN,
	FINISHED,
}

const ReportDialog = (props: ReportDialogProps) => {
	const report = () => props.report;

	const modal = useModalState();

	const [step, setStep] = createSignal(ReportStep.CHOOSE);

	const [type, setType] = createSignal<ReportOption>();
	const [reason, setReason] = createSignal('');

	const reportMutation = createMutation({
		async mutate() {
			const $report = report();

			const $type = type();
			const $reason = reason();

			const agent = await multiagent.connect(props.uid);

			let subject: UnionOf<'com.atproto.admin.defs#repoRef'> | UnionOf<'com.atproto.repo.strongRef'>;

			if ($report.type === REPORT_POST) {
				subject = {
					$type: 'com.atproto.repo.strongRef',
					uri: $report.uri,
					cid: $report.cid,
				};
			} else if ($report.type === REPORT_PROFILE) {
				subject = {
					$type: 'com.atproto.admin.defs#repoRef',
					did: $report.did,
				};
			} else {
				assert(false, `unexpected report: ${$report}`);
			}

			await agent.rpc.call('com.atproto.moderation.createReport', {
				data: {
					reasonType: $type!.value,
					subject: subject,
					reason: $reason,
				},
			});
		},
		onMutate() {
			modal.disableBackdropClose.value = true;
		},
		onSettled() {
			modal.disableBackdropClose.value = false;
		},
		onSuccess() {
			setStep(ReportStep.FINISHED);
		},
	});

	const renderOptions = () => {
		const $report = report();
		const nodes: JSX.Element[] = [];

		for (const option of options) {
			if (!(option.label & $report.type)) {
				continue;
			}

			nodes.push(
				<button
					onClick={() => setType(option)}
					class={/* @once */ menu.item()}
					classList={{ 'group is-active': type() === option }}
				>
					<div class="grow">
						<p>{option.name}</p>
						<p class="text-muted-fg">{option.desc}</p>
					</div>
					<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
				</button>,
			);
		}

		return nodes;
	};

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>
				{step() !== ReportStep.FINISHED ? `What's happening?` : `Report finished`}
			</h1>

			<Switch>
				<Match when={step() === ReportStep.CHOOSE}>
					<p class="mt-4 text-sm text-muted-fg">Select the option that applies for this content</p>

					<div class="-mx-4 mt-3 flex flex-col">{renderOptions()}</div>

					{report().type & REPORT_PROFILE ? (
						<p class="mb-2 mt-3 text-sm text-muted-fg">For other issues, please report the specific posts.</p>
					) : null}

					<div class={/* @once */ dialog.actions()}>
						<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
							Cancel
						</button>
						<button
							disabled={type() === undefined}
							onClick={() => {
								setReason('');
								setStep(ReportStep.EXPLAIN);
							}}
							class={/* @once */ button({ color: 'primary' })}
						>
							Next
						</button>
					</div>
				</Match>

				<Match when={step() === ReportStep.EXPLAIN}>
					<p class="mt-4 text-sm">
						You are reporting for <span class="font-bold">{type()?.name}</span>
					</p>

					<p class="mb-2 mt-4 text-sm text-muted-fg">Any additional details?</p>

					<textarea
						ref={model(reason, setReason)}
						placeholder="Add details..."
						rows={4}
						disabled={reportMutation.isLoading}
						class={/* @once */ textarea({ class: 'shrink-0' })}
					/>

					<Show when={reportMutation.error} keyed>
						{(error: any) => (
							<p class="mt-2 text-sm leading-6 text-red-500">
								{error.cause ? error.cause.message : error.message || '' + error}
							</p>
						)}
					</Show>

					<div class={/* @once */ dialog.actions()}>
						<button onClick={() => setStep(ReportStep.CHOOSE)} class={/* @once */ button({ color: 'ghost' })}>
							Back
						</button>
						<button
							disabled={reportMutation.isLoading}
							onClick={() => reportMutation.mutate(null)}
							class={/* @once */ button({ color: 'primary' })}
						>
							Submit
						</button>
					</div>
				</Match>

				<Match when={step() === ReportStep.FINISHED}>
					<p class="mt-4 text-sm">Your report has been submitted successfully</p>

					<div class={/* @once */ dialog.actions()}>
						<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
							Close
						</button>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default ReportDialog;
