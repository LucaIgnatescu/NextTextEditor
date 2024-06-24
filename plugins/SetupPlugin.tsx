"use client";

import { MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { registerCodeHighlighting } from "@lexical/code";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useEffect } from "react";

// function $getAdjacentNodes(node: LexicalNode) {
//   const nodes = [];
//   let temp: LexicalNode | null = node;
//
//   while (temp && !$isLineBreakNode(temp)) {
//     nodes.push(temp);
//     temp = temp.getPreviousSibling();
//   }
//   nodes.reverse();
//   temp = node.getNextSibling();
//   while (temp && !$isLineBreakNode(temp)) {
//     nodes.push(temp);
//     temp = temp.getNextSibling();
//   }
//   return nodes;
// }

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
    return mergeRegister(
      registerCodeHighlighting(editor),
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
