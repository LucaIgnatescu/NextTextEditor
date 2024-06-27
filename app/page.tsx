import { Editor, Wrapper, saveAction } from "./Editor";

const save: saveAction = async (state?: string) => {
  "use server";
  console.log("saving");
  console.log(state);
};

export default function Home() {
  return (
    <main className="">
      <Editor Wrapper={Wrapper} save={save} />
    </main>
  );
}
