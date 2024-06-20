"use client";

import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getRoot, $getSelection, $isRootNode, $isTextNode } from "lexical";

export function Toolbar({ preserveNewLines }: { preserveNewLines: boolean }) {
  const [editor] = useLexicalComposerContext();
  function markdownConverter() {
    const root = $getRoot();
    const firstNode = root.getFirstChild();
    console.log("converting");

    if ($isCodeNode(firstNode) && firstNode.getLanguage() === 'markdown') {
      const markdown = firstNode.getTextContent();
      $convertFromMarkdownString(markdown, TRANSFORMERS, undefined, preserveNewLines);
    } else {
      const markdown = $convertToMarkdownString(TRANSFORMERS, undefined, preserveNewLines);
      root.clear().append($createCodeNode('markdown').append($createTextNode(markdown)));
      const selection = $getSelection();
      if (selection?.getNodes().length === 1) {
        const node = selection.getNodes()[0];
        if ($isTextNode(node) || node.getTextContent() === "") {
          node.selectEnd();
        }
      }
    }
  }

  return (
    <div>
      <button onClick={() => editor.update(markdownConverter)}>MD</button>
    </div>
  );
}
