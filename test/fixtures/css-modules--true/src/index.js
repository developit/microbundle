import global from './scoped.css';
import scoped from './scoped.module.css';

export default function() {
	const el = document.createElement('div');
	el.className =
		scoped.scoped_class + ' ' + global.test_class_that_should_be_scoped;
	return el;
}
