import { APP, Message, Model, MODELS, sha256, storage } from "./Common";
import { createSignal, onMount, Show } from "solid-js";
import { HistoryButton, ModelSelect } from "./Header";
import Textarea, { MessageWindow } from "./Main";

export default function LLM() {
  const [value, _setValue] = createSignal("");
  const [asyncValue, setAsyncValue] = createSignal("");
  const [isListening, setIsListening] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const appendCodeblock = () => ((value().match(/```/g)?.length ?? 0) % 2 ? "```" : "");
  const [model, setModel] = createSignal<Model>(MODELS.filter(x => x.name === storage.model)[0]);
  let textarea = document.createElement("textarea");

  function setValue(value: string) {
    _setValue(value);
    console.log(value);
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function clear() {
    setMessages([]);
  }

  function changeModel(model: Model) {
    textarea.focus();
    setModel(model);
    storage.model = model.name;
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
    const data = JSON.stringify({ messages: newMessages, ...model() });
    const hash = await sha256(storage.salt + data);
    const ws = new WebSocket(`wss://${location.host}/api/${APP}/ws/${hash}`);
    ws.onopen = () => ws.send(data);
    ws.onmessage = e => {
      console.log("onmessage", e.data);
      setAsyncValue(asyncValue() + e.data);
      console.log(e.data);
    };
    ws.onclose = () => {
      console.log("onclose", [...messages(), { role: "assistant", content: asyncValue() }]);
      setMessages([...messages(), { role: "assistant", content: asyncValue() }]);
      setIsListening(false);
      setAsyncValue("");
    };
  }

  function onDeleteKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "Backspace") {
      e.preventDefault();
      clear();
    }
  }

  function changeHistory(proceed: number) {}

  return (
    <div
      onKeyDown={onDeleteKeyDown}
      class="py-3 overflow-y-scroll h-screen"
    >
      <div class="pb-2 px-4 w-full flex justify-end">
        <ModelSelect
          onClick={onClick}
          model={model()}
          setModel={changeModel}
        />
        <HistoryButton onClick={changeHistory} />
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
      <Textarea
        value={value()}
        setValue={setValue}
        submit={onClick}
        clear={clear}
        ref={textarea}
      />
    </div>
  );
}
