export default interface Route {
  path?: string;
  element: React.ReactElement;
  menuLabel?: string;
  index?: boolean | number;
  parent?: string;
  loader?: () => Promise<any>;
}