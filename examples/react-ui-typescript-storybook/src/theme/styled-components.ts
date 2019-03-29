import * as UIComponents from "styled-components";
import { ThemeInterface } from './theme'
const {
  default: styled,
  css,
  injectGlobal,
  keyframes,
  ThemeProvider
} = UIComponents as UIComponents.ThemedStyledComponentsModule<ThemeInterface> as UIComponents.ThemedStyledComponentsModule<ThemeInterface>;

export { css, injectGlobal, keyframes, ThemeProvider };
export default styled;
