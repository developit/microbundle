import * as React from "react";
import styled from "../../theme/styled-components";
import {
  fontWeight,
  borders,
  borderColor,
  buttonStyle,
  borderRadius
} from "styled-system";
import { themed } from "../../theme/utils";
import { Flex } from "../Flex/Flex";
import { COLOR_PRIMARY } from "../../theme/theme";


const BaseButton = styled<ButtonProps>(Flex)`
  appearance: none;
  text-align: center;
  line-height: inherit;
  text-decoration: none;
  transition: background-color 0.25s;
  white-space: nowrap;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.2 : 1)};
  transition: opacity 0.2s ease;

  ${fontWeight}
  ${borders}
  ${borderColor}
  ${borderRadius}
  ${buttonStyle}
  ${themed("Button")}

  > * {
    margin: 0 4px;
    color: inherit;
  }
`;

export interface ButtonProps {
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export const Button: React.FunctionComponent<ButtonProps> = ({
  children,
  disabled = false,
  onClick,
  variant = "primary",
  ...rest
}) => (
  <BaseButton
    as="button"
    disabled={disabled}
    onClick={disabled ? null : onClick}
    fontSize={14}
    m={0}
    p={2}
    variant={variant}
    border={0}
    borderRadius={4}
    {...rest}
  >
    {children}
  </BaseButton>
);
