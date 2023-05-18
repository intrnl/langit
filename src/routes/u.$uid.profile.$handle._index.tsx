import { useParams } from '~/router';

const AuthenticatedProfileTimelinePage = () => {
	const params = useParams('/u/:uid/profile/:handle');

	return <div>this is the timeline!</div>;
};

export default AuthenticatedProfileTimelinePage;
