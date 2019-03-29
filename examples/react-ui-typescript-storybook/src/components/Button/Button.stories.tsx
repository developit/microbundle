import React from "react";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { text, select, boolean } from "@storybook/addon-knobs";

import { Button } from "./Button";

const knobs = {
  variant: {
    label: "Variant",
    options: ["primary", "secondary"]
  },
  icon: {
    label: "Icon",
    options: []
  },
  disabled: {
    label: 'disabled',
    defaultValue: false
  }
};

storiesOf("Button", module)
  .add("Primary Button", () => (
    <Button
      variant={select(knobs.variant.label, knobs.variant.options, "primary")}
      onClick={action("clicked")}
      disabled={boolean(knobs.disabled.label, knobs.disabled.defaultValue)}
    >
      {text("Label", "Primary Button")}
    </Button>
  ))
  .add("Secondary Button", () => (
    <Button
      variant={select(knobs.variant.label, knobs.variant.options, "secondary")}
      onClick={action("clicked")}
      disabled={boolean(knobs.disabled.label, knobs.disabled.defaultValue)}
    >
      {text("Label", "Secondary Button")}
    </Button>
  ));
