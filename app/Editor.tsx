"use client";

import { MarkdownBlockNode } from "@/nodes/MarkdownBlockNode";
import { LiveConversion } from "@/plugins/LiveConversion";
import { SetupPlugin } from "@/plugins/SetupPlugin";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ComponentType, ReactNode, useContext } from "react";
import { createContext } from "react";

const theme = {
  // code: "before:content-[attr(data-gutter)]" // TODO: Add line number positioning
};

export function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center items-center my-5">
      <div className="bg-gray-300 w-2/3 p-5 border border-black">
        {children}
      </div>
    </div>
  );
}

export const UtilsContext = createContext<UtilsContextValue>(null);

export type saveAction = (state?: string) => Promise<void>;

export type UtilsContextValue = { // TODO: add option to modify state before saving
  save: saveAction,
} | null;

export function useUtilsContext() {
  const context = useContext(UtilsContext);
  if (context === null) throw Error("UtilsContext value not set properly");
  return context;
}

export function Editor({ Wrapper, save }: { Wrapper: ComponentType<{ children: ReactNode }>, save?: saveAction }) {
  const initialConfig = {
    namespace: "NextEditor",
    theme,
    nodes: [MarkdownBlockNode, LinkNode, ListNode, ListItemNode, HorizontalRuleNode, HeadingNode, QuoteNode, CodeNode, CodeHighlightNode],
    onError(error: Error) { console.error(error); },
  };

  if (save === undefined) {
    save = async () => {
      throw new Error("save not implemented in Editor.tsx");
    };
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Wrapper>
        <UtilsContext.Provider value={{ save }}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="focus:outline-none" />}
            placeholder={<div className="text-center">Enter some text ...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <SetupPlugin />
          <LiveConversion />
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </UtilsContext.Provider>
      </Wrapper>
    </LexicalComposer >);
}
