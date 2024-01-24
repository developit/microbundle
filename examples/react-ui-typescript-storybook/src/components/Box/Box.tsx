import styled from "../../theme/styled-components";

import {
  color,
  ColorProps,
  space,
  SpaceProps,
  width,
  WidthProps,
  fontSize,
  FontSizeProps,
  flex,
  FlexProps,
  order,
  OrderProps,
  alignSelf,
  AlignSelfProps
} from "styled-system";

import { css, themed } from "../../theme/utils";

export type BoxProps = ColorProps &
  SpaceProps &
  WidthProps &
  FontSizeProps &
  FlexProps &
  OrderProps &
  AlignSelfProps;

export const Box = styled<BoxProps>('div')`
  ${space}
  ${width}
  ${fontSize}
  ${color}
  ${flex}
  ${order}
  ${alignSelf}
  ${themed("Box")}
  ${css}
`;

Box.displayName = "Box";
