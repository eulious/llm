import { createEffect, Ref } from "solid-js";
import { ChangeEvent, Message } from "./Common";
import { marked } from "marked";

interface TextareaProps {
  setValue: (value: string) => void;
  value: string;
  submit: () => void;
  clear: () => void;
  ref: Ref<HTMLTextAreaElement>;
}
export default function Textarea(props: TextareaProps) {
  function onInput(e: ChangeEvent<HTMLTextAreaElement>) {
    props.setValue(e.currentTarget.value);
  }

  function onReturnKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      props.submit();
    }
  }

  return (
    <div class="flex justify-end">
      <div class="w-2/3 h-24">
        <textarea
          ref={props.ref}
          onKeyDown={onReturnKeyDown}
          rows="1"
          class="scrollbar overflow-hidden w-full p-3 ml-2 rounded-md resize-none border-gray-300 text-gray-700 text-lg outline-gray-300 border"
          autocomplete="off"
          spellcheck={false}
          value={props.value}
          oninput={onInput}
        />
      </div>
      <div class="px-5">
        <button
          class="border border-gray-500  hover:bg-gray-400 h-12 w-20 rounded px-4 py-1"
          onClick={props.clear}
        >
          消去
        </button>
        <br />
        <div class="flex justify-center items-center"></div>
      </div>
    </div>
  );
}

export function MessageWindow(props: Message) {
  let div = document.createElement("div");
  createEffect(() => {
    div.innerHTML = marked.parse(props.content) as string;
  });
  if (props.role === "user") {
    return (
      <div class="flex justify-end">
        <div class="bg-blue-100 rounded-lg m-2 px-4 py-2 ml-14 whitespace-pre-wrap">
          <div>{props.content}</div>
        </div>
      </div>
    );
  } else if (props.role === "assistant") {
    return (
      <div>
        <div class="markdown-body m-2">
          <div
            class="bg-gray-200 rounded-lg px-4 pt-2 pb-[1px] mr-14"
            ref={div}
          />
        </div>
      </div>
    );
  }
}
