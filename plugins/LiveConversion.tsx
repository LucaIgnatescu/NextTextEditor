"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getRoot, $getSelection, $isParagraphNode, $setSelection, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_NORMAL, KEY_ESCAPE_COMMAND, LexicalNode, SELECTION_CHANGE_COMMAND } from "lexical";
import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code";
import { useEffect, useState } from "react";
import { $isListItemNode } from "@lexical/list";
import { $convertToMarkdownString } from "./ConvertToMarkdown";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $createMarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { mergeRegister } from "@lexical/utils";
import { SAVE_COMMAND } from "./SetupPlugin";


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

export function $restoreDOM() { // NOTE: Assumes markdown block is always a direct child of root
  const root = $getRoot();
  for (const node of root.getChildren()) {
    if ($isCodeNode(node) && (node as CodeNode).getLanguage() === 'markdown') {
      $restoreText(node);
    }
  }
}

export function LiveConversion() {
  const [editor] = useLexicalComposerContext();
  const [history, setHistory] = useState<null | CodeNode>(null);

  useEffect(() =>
    mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          if (!$isConvertible()) return true;
          editor.update(() => {
            console.log("running selection handler");
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
          const state = editor.getEditorState().toJSON();
          return true;
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          editor.update(() => {
            $restoreDOM();
            setHistory(null);
            $setSelection(null);
            editor.dispatchCommand(SAVE_COMMAND, null);
          });
          return true;
        },
        COMMAND_PRIORITY_NORMAL
      ),
    ), [editor, history]);
  return null;
}
