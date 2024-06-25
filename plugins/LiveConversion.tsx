"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getSelection, $isParagraphNode, COMMAND_PRIORITY_EDITOR, LexicalNode, RangeSelection, SELECTION_CHANGE_COMMAND } from "lexical";
import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code";
import { useEffect, useState } from "react";
import { $isListItemNode } from "@lexical/list";
import { $convertToMarkdownString } from "./ConvertToMarkdown";
import { TRANSFORMERS } from "@lexical/markdown";


function $getHoveredNode(): LexicalNode | null {
  const nodes = $getSelection()?.getNodes();
  if (nodes === undefined || nodes?.length === 0) return null;
  return nodes[0];
}

function $isConvertible(): boolean {
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
  if (parent === null) return null;
  return $convertToMarkdownString(TRANSFORMERS, parent, true);
}

function $convertToMarkdownDOM() {
  const node = $getHoveredNode();
  const markdown = $getMarkdownElement();
  if (markdown === null) return;
  const parent = !$isListItemNode(node?.getParent()) ? node?.getParent() : node?.getParent()?.getParent();
  if (parent === null || parent === undefined) return;
  parent.insertAfter($createCodeNode('markdown').append($createTextNode(markdown)));
  parent.remove();
}

function $restoreText(node: CodeNode) {
  console.log(node);
  console.log(node.getTextContent());
  return;
}

function $getCodeParent(node: LexicalNode | null): CodeNode | null {
  let temp = node;
  while (temp !== null && !$isCodeNode(temp)) {
    temp = temp.getParent();
  }
  if (!$isCodeNode(temp)) return null;
  return temp;
}

export function LiveConversion() {
  const [editor] = useLexicalComposerContext();
  const [history, setHistory] = useState<null | CodeNode>(null);
  useEffect(() =>
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const codeParent = $getCodeParent($getHoveredNode());
        if (history === null || history.getKey() !== codeParent?.getKey()) {
          if (history !== null) {
            $restoreText(history);
          }
          console.log("changing history");
          setHistory(codeParent);
        }
        if (!$isConvertible()) return true;
        editor.update($convertToMarkdownDOM);
        // $convertToMarkdownDOM();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ), [editor, history]);
  return null;
}
