import { lighten, darken } from 'polished'

export const COLOR_PRIMARY = '#17293f';
export const COLOR_SECONDARY = '#15dffd';
export const COLOR_GREY = "#b7c1c6";
export const COLOR_BACKGROUND_GREY = 'whitesmoke';
export const COLOR_WHITE = 'white';

interface FontInterface {
  primary: string;
  secondary: string;
}

interface ColorsInterface {
  primary: string;
  secondary: string;
  success: string;
  light: string;
  lighter: string;
  primaryOpaque: string;
}

interface ShadowsInterface {
  small: string;
  large: string;
}

export interface ThemeInterface {
  base: number;
  font: FontInterface;
  colors: ColorsInterface;
  space: number[];
  shadows: ShadowsInterface;
  buttons: any; // TODO: define variants types
}

export const theme: ThemeInterface = {
  base: 8,
  font: {
    primary: '"Open Sans", sans-serif',
    secondary: 'Baskerville, Times New Roman, Serif, serif'
  },
  colors: {
    primary: COLOR_PRIMARY,
    secondary: COLOR_SECONDARY,
    success: 'rgba(45 ,205 ,115 , 1)',
    light: 'rgba(245,245,245,1)',
    lighter: 'rgba(250 ,250 ,250 , 1)',
    primaryOpaque: lighten(0.3, COLOR_PRIMARY)
  },
  space: [
    0, 4, 8, 16, 24, 32, 64, 128, 256, 512
  ],
  shadows: {
    small: '0 0 4px rgba(0, 0, 0, .125)',
    large: '0 0 24px rgba(0, 0, 0, .125)'
  },
  buttons: {
    primary: {
      color: COLOR_WHITE,
      backgroundColor: COLOR_PRIMARY,
      '&:hover': {
        backgroundColor: lighten(0.2, COLOR_PRIMARY),
      }
    },
    secondary: {
      color: COLOR_WHITE,
      backgroundColor: COLOR_SECONDARY,
      '&:hover': {
        backgroundColor: darken(0.2, COLOR_SECONDARY),
      }
    }
  }
};
