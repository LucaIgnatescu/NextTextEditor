"use client";

import { MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { SetupPlugin } from "@/plugins/SetupPlugin";
import { Toolbar } from "@/plugins/Toolbar";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

const theme = {
  // code: "before:content-[attr(data-gutter)]" // TODO: Add line number positioning
};


export function Editor() {
  const initialConfig = { // TODO: Add initial state
    namespace: "NextEditor",
    theme,
    nodes: [MarkdownBlockNode, LinkNode, ListNode, ListItemNode, HorizontalRuleNode, HeadingNode, QuoteNode, CodeNode, CodeHighlightNode],
    onError(error: Error) { console.error(error); },
  };
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex justify-center items-center my-5">
        <div className="bg-gray-300 w-2/3 p-5 border border-black">

          <RichTextPlugin
            contentEditable={<ContentEditable className="focus:outline-none" />}
            placeholder={<div className="text-center">Enter some text ...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />

          <Toolbar preserveNewLines={true} />

          <SetupPlugin />
          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
          <AutoFocusPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>);
}
