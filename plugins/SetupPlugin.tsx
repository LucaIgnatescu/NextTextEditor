"use client";

import { $createMarkdownBlockNode, MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { registerCodeHighlighting } from "@lexical/code";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodes } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { $createNodeSelection, $getRoot, $getSelection, $isElementNode, $isLineBreakNode, $splitNode, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR, KEY_ENTER_COMMAND, KEY_TAB_COMMAND, LexicalNode, NodeSelection, SELECTION_CHANGE_COMMAND } from "lexical";
import { useEffect } from "react";
import { $convertToMarkdownString } from "./ConvertToMarkdown";
import { $isListItemNode } from "@lexical/list";

function $getAdjacentNodes(node: LexicalNode) {
  const nodes = [];
  let temp: LexicalNode | null = node;

  while (temp && !$isLineBreakNode(temp)) {
    nodes.push(temp);
    temp = temp.getPreviousSibling();
  }
  nodes.reverse();
  temp = node.getNextSibling();
  while (temp && !$isLineBreakNode(temp)) {
    nodes.push(temp);
    temp = temp.getNextSibling();
  }
  return nodes;
}

function $getLine(): LexicalNode[] {
  const selection = $getSelection();
  const nodes = selection?.getNodes();
  if (nodes === undefined || nodes?.length === 0) return [];
  const node = nodes[0];
  return $getAdjacentNodes(node);
}

function $getMarkdownElement(): string | null {
  const selection = $getSelection();
  const nodes = selection?.getNodes();
  if (nodes === undefined || nodes?.length === 0) return null;
  let parent = nodes[0].getParent();
  if (parent === null) return null;
  if ($isListItemNode(parent)) parent = parent.getParent();
  //@ts-ignore
  return $convertToMarkdownString(TRANSFORMERS, parent, true);
}

function pruneMDWrappers(mdNode: MarkdownBlockNode) {
  const next = mdNode.getNextSibling();
  if (next === null) { // TODO: treat this case
    const parent = mdNode.getParent();
    if (parent === null) return;
    mdNode.getChildren()?.forEach(node => parent.append(node));
  }
  mdNode.getChildren()?.forEach(node => next?.insertBefore(node));
  mdNode.remove();
}

export function SetupPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(registerCodeHighlighting(editor),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection();
          const nodes = selection?.getNodes();
          if (nodes === undefined || nodes?.length === 0) return true;
          const node = nodes[0];
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        () => {
          const nodes = $getLine();
          console.log($getMarkdownElement());
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerNodeTransform(MarkdownBlockNode, pruneMDWrappers)
    );
  }, [editor]);

  useEffect(() => editor.update(() => {
    $convertFromMarkdownString(`# This is a heading

## This is a another heading

This is a paragraph. Many elements are here

This is another paragraph

\`\`\`javascript
console.log("some code");
\`\`\`

- List item 1
- List item 2

1. List item 1
2. List item 2

Some text with ***bold***.`, TRANSFORMERS, undefined, true);
  }), [editor]);

  return null;
}
