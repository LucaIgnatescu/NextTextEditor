"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getSelection, $isParagraphNode, COMMAND_PRIORITY_EDITOR, LexicalNode, RangeSelection, SELECTION_CHANGE_COMMAND } from "lexical";
import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code";
import { useEffect, useState } from "react";
import { $isListItemNode } from "@lexical/list";
import { $convertToMarkdownString } from "./ConvertToMarkdown";
import { TRANSFORMERS } from "@lexical/markdown";
class History {
  states: Array<RangeSelection>;
  max_capacity: number;
  constructor(max_capacity = 10, states?: Array<RangeSelection>) {
    this.max_capacity = max_capacity;
    this.states = states === undefined ? [] : states;
  }
  addEntry(entry: RangeSelection): History {
    this.states.push(entry);
    const new_array = this.states.length < this.max_capacity ? this.states.slice() : this.states.slice(-this.max_capacity + 1);
    return new History(this.max_capacity, new_array);
  }
  getLatest(): RangeSelection | undefined {
    return this.states.at(-1);
  }
  isDifferent(entry: RangeSelection): boolean {
    return this.states.at(-1)?.anchor.key !== entry.anchor.key;
  }
}

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

export function LiveConversion() {
  const [editor] = useLexicalComposerContext();
  const [history, setHistory] = useState(new History());
  useEffect(() =>
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        console.log(history);
        const selection = $getSelection() as RangeSelection | null;
        if (selection === null) return true;
        if (history.isDifferent(selection)) setHistory(history.addEntry(selection));
        if (!$isConvertible()) return true;
        $convertToMarkdownDOM();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    ), [editor, history]);
  return null;
}
