import { ElementNode, NodeKey } from "lexical";

export class MarkdownBlockNode extends ElementNode {
  constructor(key?: NodeKey) {
    super(key);
  }
  static getType(): string {
    return 'markdown-block';
  }

  static clone(node: MarkdownBlockNode): MarkdownBlockNode {
    return new MarkdownBlockNode(node.__key);
  }
  createDOM(): HTMLElement {
    return document.createElement('div');
  }
  updateDOM(prevNode: MarkdownBlockNode, dom: HTMLElement): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return true;
  }
}

export function $createMarkdownBlockNode(key?: NodeKey) {
  return new MarkdownBlockNode(key);
}
