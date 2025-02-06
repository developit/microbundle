import { addParameters, configure, addDecorator } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { themes } from '@storybook/theming';
import { Theming } from './Decorators'

// Option defaults.
addParameters({
  options: {
    name: 'Theme',
    theme: themes.dark,
  },
});

// Decorators
addDecorator(Theming);
addDecorator(withKnobs);

// automatically import all files ending in *.stories.js
const req = require.context('../src', true, /\.stories\.tsx$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
