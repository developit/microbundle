import React from "react";
import { storiesOf } from "@storybook/react";
import { number } from '@storybook/addon-knobs';


import { Flex } from "./Flex";

storiesOf("Flex", module)
.add("Base Flex", () => (
  <Flex
		bg="white"
		color="primary"
	>
      <span>Base Flex</span>
    </Flex>
	))
	.add("Flex with Margin & Padding", () => {
		const margin = number("Equal Margin", 2);
		const padding = number("Equal Padding", 2)
		return (
			<Flex
				m={margin}
				p={padding}
				bg="white"
				color="primary"
			>
				<span>{`margin: ${margin}, padding: ${padding}`}</span>
			</Flex>
		)
	});
