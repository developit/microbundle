import React from "react";
import { storiesOf } from "@storybook/react";
import { number } from '@storybook/addon-knobs';


import { Box } from "./Box";

storiesOf("Box", module)
  .add("Base Box", () => (
    <Box
		bg="white"
		color="primary"
    >
      <span>margin: 2, padding: 2</span>
    </Box>
	))
	.add("Box with Margin & Padding", () => (
    <Box
	  m={number("Equal Margin", 2)}
		p={number("Equal Padding", 2)}
		bg="white"
		color="primary"
    >
      <span>margin: 2, padding: 2</span>
    </Box>
  ));
