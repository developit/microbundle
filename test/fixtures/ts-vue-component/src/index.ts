// @ts-ignore vue is not included in build
import Vue from 'vue';
// @ts-ignore
import hello from './component.ts.vue';

new Vue({
	el: '#app',
	components: {
		hello,
	},
});
