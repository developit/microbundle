export const css = (props: {css: any}) => props.css;
export const themed = (key: string) => (props: {theme: {[key: string]: any}}) => props.theme[key];
