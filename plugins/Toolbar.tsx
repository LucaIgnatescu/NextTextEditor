"use client";

import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getRoot, $getTextContent } from "lexical";

export function Toolbar({ preserveNewLines }: { preserveNewLines: boolean }) {
  const [editor] = useLexicalComposerContext();
  function markdownConverter() {
    const root = $getRoot();
    const firstNode = root.getFirstChild();

    if ($isCodeNode(firstNode) && firstNode.getLanguage() === 'markdown') {
      const markdown = firstNode.getTextContent();
      $convertFromMarkdownString(markdown, TRANSFORMERS, undefined, preserveNewLines);
    } else {
      const markdown = $convertToMarkdownString(TRANSFORMERS, undefined, preserveNewLines);
      root.clear().append($createCodeNode('markdown').append($createTextNode(markdown)));
    }
  }

  return (
    <div>
      <button onClick={() => editor.update(markdownConverter)}>MD</button>
    </div>
  );
}
