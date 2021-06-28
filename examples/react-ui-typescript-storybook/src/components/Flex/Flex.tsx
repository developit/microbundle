import styled from '../../theme/styled-components'
import { Box } from '../Box/Box'
import {
  flexWrap,
  FlexWrapProps,
  flexDirection,
  FlexDirectionProps,
  alignItems,
  AlignItemsProps,
  justifyContent,
  JustifyContentProps,

} from 'styled-system'

import { themed } from '../../theme/utils'

export type FlexProps = FlexWrapProps & FlexDirectionProps & AlignItemsProps & JustifyContentProps

export const Flex = styled<FlexProps>(Box)`
  display: flex;
  ${flexWrap};
  ${flexDirection};
  ${alignItems};
  ${justifyContent};
  ${themed('Flex')};
`

Flex.displayName = "Flex"
