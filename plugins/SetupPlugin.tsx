"use client";

import { $createMarkdownBlockNode, MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { $createCodeNode, $isCodeNode, CodeNode, registerCodeHighlighting } from "@lexical/code";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $createLineBreakNode, $createTextNode, $getSelection, $isLineBreakNode, $isParagraphNode, COMMAND_PRIORITY_EDITOR, KEY_TAB_COMMAND, LexicalNode, ParagraphNode, SELECTION_CHANGE_COMMAND } from "lexical";
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

function $getHoveredNode(): LexicalNode | null {
  const nodes = $getSelection()?.getNodes();
  if (nodes === undefined || nodes?.length === 0) return null;
  return nodes[0];
}


function $shouldConvert(): boolean {
  const nodes = $getSelection()?.getNodes();
  if (nodes === undefined || nodes?.length === 0) return false;
  const node = nodes[0];
  if ($isParagraphNode(node) && node.getChildren().length === 0) return false;
  const parent = nodes[0].getParent();
  return !(parent !== null && $isCodeNode(parent) && (parent as CodeNode).getLanguage() === 'markdown');
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

function $convertToMarkdownDOM() { // BUG: Selection behaves weirdly
  const node = $getHoveredNode();
  const markdown = $getMarkdownElement();
  if (markdown === null) return;
  const parent = !$isListItemNode(node?.getParent()) ? node?.getParent() : node?.getParent()?.getParent();
  if (parent === null || parent === undefined) return;
  parent.insertAfter($createCodeNode('markdown').append($createTextNode(markdown)));
  parent.remove();
}

function pruneMDWrappers(node: MarkdownBlockNode) {
  const next = node.getNextSibling();
  if (next === null) { // TODO: treat this case
    const parent = node.getParent();
    if (parent === null) return;
    node.getChildren()?.forEach(node => parent.append(node));
  }
  node.getChildren()?.forEach(node => next?.insertBefore(node));
  node.remove();
}


export function SetupPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(registerCodeHighlighting(editor),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          console.log("selection");
          if (!$shouldConvert()) return true;
          $convertToMarkdownDOM();
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerNodeTransform(MarkdownBlockNode, pruneMDWrappers),
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
