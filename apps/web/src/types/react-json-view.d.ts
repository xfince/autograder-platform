declare module 'react-json-view' {
  import { ComponentType } from 'react';

  export interface ReactJsonViewProps {
    src: any;
    theme?: string;
    displayDataTypes?: boolean;
    displayObjectSize?: boolean;
    enableClipboard?: boolean;
    collapsed?: boolean | number;
    name?: string | false;
    indentWidth?: number;
    collapseStringsAfterLength?: number;
    groupArraysAfterLength?: number;
    onEdit?: (edit: any) => void;
    onAdd?: (add: any) => void;
    onDelete?: (del: any) => void;
    style?: React.CSSProperties;
  }

  const ReactJson: ComponentType<ReactJsonViewProps>;
  export default ReactJson;
}
