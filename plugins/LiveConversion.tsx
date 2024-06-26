"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getSelection, $isParagraphNode, $setSelection, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR, LexicalNode, SELECTION_CHANGE_COMMAND } from "lexical";
import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code";
import { useEffect, useState } from "react";
import { $isListItemNode } from "@lexical/list";
import { $convertToMarkdownString } from "./ConvertToMarkdown";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $createMarkdownBlockNode } from "@/nodes/MarkdownBlockNode";


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
  if (markdown === null) return null;
  const parent = !$isListItemNode(node?.getParent()) ? node?.getParent() : node?.getParent()?.getParent();
  if (parent === null || parent === undefined) return null;
  const codeNode = $createCodeNode('markdown').append($createTextNode(markdown));
  parent.insertAfter(codeNode);
  parent.remove();
  return codeNode;
}

function $restoreText(node: CodeNode) {
  const markdown = node.getTextContent();
  const temp = $createMarkdownBlockNode();
  node.insertAfter(temp);
  $convertFromMarkdownString(markdown, TRANSFORMERS, temp, true);
  node.remove();
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
        console.log($getHoveredNode(), history);
        if (!$isConvertible()) return true;
        editor.update(() => {
          const codeParent = $convertToMarkdownDOM();
          if (codeParent === null) return;
          if (history === null || history.getKey() !== codeParent?.getKey()) {
            if (history !== null) {
              $restoreText(history);
            }
            setHistory(codeParent);
          }
          $setSelection(null);
        });
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    ), [editor, history]);
  return null;
}
