import twoStyles from './two.css';

export default function() {
	const el = document.createElement('div');
	el.className = twoStyles.testing;
	return el;
}
