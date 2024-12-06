import { createEffect, createSignal, onMount, Show } from "solid-js";
import { ChangeEvent, Message, sha256, storage } from "./Common";
import { marked } from "marked";

const models = ["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview", "gemini-1.5-flash", "gemini-1.5-pro"];

export default function LLM() {
  const [value, _setValue] = createSignal("");
  const [asyncValue, setAsyncValue] = createSignal("");
  const [isListening, setIsListening] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const appendCodeblock = () => ((value().match(/```/g)?.length ?? 0) % 2 ? "```" : "");
  const [model, setModel] = createSignal(storage.model);
  let textarea = document.createElement("textarea");

  function setValue(value: string) {
    _setValue(value);
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function onInput(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.currentTarget.value);
  }

  function clear() {
    setMessages([]);
  }

  function changeModel(model: string) {
    textarea.focus();
    setModel(model);
    storage.model = model;
    if (messages().length) {
      setValue(messages()[0].content);
      setMessages([]);
    }
  }

  onMount(() => {
    textarea.focus();
  });

  async function onClick() {
    if (!value().length) return;
    const newMessages: Message[] = [...messages(), { role: "user", content: value() }];
    setMessages(newMessages);
    setValue("");
    setIsListening(true);
    setAsyncValue("");
    const data = JSON.stringify({ messages: newMessages, model: model() });
    const hash = await sha256(storage.salt + data);
    const ws = new WebSocket(`wss://${location.host}/api/llm/ws/${hash}`);
    ws.onopen = () => ws.send(data);
    ws.onmessage = e => {
      setAsyncValue(asyncValue() + e.data);
    };
    ws.onclose = () => {
      setMessages([...messages(), { role: "assistant", content: asyncValue() }]);
      setIsListening(false);
      setAsyncValue("");
    };
  }

  function onReturnKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      onClick();
    }
  }

  function onDeleteKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "Backspace") {
      e.preventDefault();
      clear();
    }
  }

  return (
    <div
      onKeyDown={onDeleteKeyDown}
      class="py-3 overflow-y-scroll h-screen"
    >
      <div class="pb-2 flex justify-end">
        <ModelSelect
          onClick={onClick}
          model={model()}
          setModel={changeModel}
        />
        {/* <button
          class=" hover:bg-gray-200 duration-300 rounded border px-4 py-1"
          onClick={clear}
        >
          消去
        </button> */}
      </div>
      <div class="w-full">
        {messages().map((x: Message) => (
          <MessageWindow {...x} />
        ))}
        <Show when={isListening()}>
          <MessageWindow
            role="assistant"
            content={asyncValue() ? asyncValue() + appendCodeblock() : "実行中..."}
          />
        </Show>
      </div>
      <div class="flex justify-end">
        <div class="w-2/3 h-24">
          <textarea
            ref={textarea}
            onKeyDown={onReturnKeyDown}
            rows="1"
            class="scrollbar overflow-hidden w-full p-3 rounded-md resize-none border-gray-300 text-gray-700 text-lg outline-gray-300 border"
            autocomplete="off"
            spellcheck={false}
            value={value()}
            oninput={onInput}
          />
        </div>
        <div class="px-5">
          {/*<button
            class="border border-gray-500  hover:bg-gray-400 h-12 w-24 rounded px-4 py-1"
            onClick={onClick}
          >
            送信
          </button>*/}
          <button
            class="border border-gray-500  hover:bg-gray-400 h-12 w-24 rounded px-4 py-1"
            onClick={clear}
          >
            消去
          </button>
          <br />
          <div class="flex justify-center items-center"></div>
        </div>
      </div>
    </div>
  );
}

function ModelSelect(props: { model: string; setModel: (model: string) => void; onClick: () => void }) {
  return (
    <div class="flex px-4">
      {models.map(x => (
        <div class="cursor-pointer border border-gray-500 m-[1px] rounded truncate">
          {x === props.model ? (
            <div
              onClick={() => props.onClick()}
              class="p-2 rounded bg-gray-500 text-white hover:bg-gray-600"
            >
              {x}
            </div>
          ) : (
            <div
              onClick={() => props.setModel(x)}
              class="p-2 hover:bg-gray-200 duration-200"
            >
              {x}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// function ModelSelect() {
//   function onChange(event: ChangeEvent<HTMLSelectElement>) {
//     storage.model = event.currentTarget.value;
//   }

//   return (
//     <div>
//       <select
//         class="border-gray-300 border rounded w-48 p-2"
//         value={storage.model}
//         onChange={onChange}
//       >
//         {models.map(x => (
//           <option value={x}>{x}</option>
//         ))}
//       </select>
//     </div>
//   );
// }

function MessageWindow(props: Message) {
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