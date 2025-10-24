import React from 'react';
import { ThemeProvider } from '../src/theme/styled-components';
import { Box, theme } from '../src'

export const Theming = (storyFn) => (
	<ThemeProvider theme={theme}>
		<Box m={2}>
			{storyFn()}
		</Box>
	</ThemeProvider>
);
