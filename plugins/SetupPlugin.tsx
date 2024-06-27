"use client";

import { useUtilsContext } from "@/app/Editor";
import { MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { registerCodeHighlighting } from "@lexical/code";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $setSelection, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR, EditorState, KEY_ESCAPE_COMMAND } from "lexical";
import { useEffect } from "react";


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
  const { save } = useUtilsContext();
  useEffect(() => {
    return mergeRegister(
      registerCodeHighlighting(editor),
      editor.registerNodeTransform(MarkdownBlockNode, pruneMDWrappers),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          $setSelection(null);
          const state = JSON.stringify(editor.getEditorState().toJSON());
          save(state);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, save]);

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
