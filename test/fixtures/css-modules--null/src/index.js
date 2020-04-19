import './not_scoped.css';
import scoped from './scoped.module.css';

export default function() {
	const el = document.createElement('div');
	el.className = scoped.scoped_class;
	return el;
}
