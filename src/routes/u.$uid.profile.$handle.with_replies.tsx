import { useParams } from '~/router';

const AuthenticatedProfileTimelineRepliesPage = () => {
	const params = useParams('/u/:uid/profile/:handle/with_replies');

	return <div>this is the timeline with replies!</div>;
};

export default AuthenticatedProfileTimelineRepliesPage;
