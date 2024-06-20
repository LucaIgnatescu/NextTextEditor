"use client";

import { $createMarkdownBlockNode, MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { registerCodeHighlighting } from "@lexical/code";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodes } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { $createNodeSelection, $getRoot, $getSelection, $isLineBreakNode, $splitNode, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR, KEY_ENTER_COMMAND, LexicalNode, NodeSelection, SELECTION_CHANGE_COMMAND } from "lexical";
import { useEffect } from "react";

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
        KEY_ENTER_COMMAND,
        () => {
          const nodes = $getLine();
          if (nodes.length === 0) return false;

          const selection = $createNodeSelection();
          nodes.map(node => node.getKey()).forEach(key => selection.add(key));
          const markdown = selection.getTextContent();

          const root = $getRoot();
          const mdContainer = $createMarkdownBlockNode();
          root.append(mdContainer);
          $convertFromMarkdownString(markdown, TRANSFORMERS, mdContainer);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerNodeTransform(MarkdownBlockNode, pruneMDWrappers)
    );
  }, [editor]);


  return null;
}
