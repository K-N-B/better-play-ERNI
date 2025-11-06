export interface NavItem {
  name: string;
  path?: string; // Optional because "┃" doesn't have a path
  activeClasses?: string;
  hoverClasses?: string;
}
