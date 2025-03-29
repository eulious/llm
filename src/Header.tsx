import { Model, MODELS } from "./Common";

export function ModelSelect(props: { model: Model; setModel: (model: Model) => void; onClick: () => void }) {
  return (
    <>
      {MODELS.map(x => (
        <div class="cursor-pointer border border-gray-500 m-[1px] rounded truncate">
          {x.name === props.model?.name ? (
            <div
              onClick={() => props.onClick()}
              class="p-2 rounded bg-gray-500 text-white hover:bg-gray-600"
            >
              {x.name}
            </div>
          ) : (
            <div
              onClick={() => props.setModel(x)}
              class="p-2 hover:bg-gray-200 duration-200"
            >
              {x.name}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function HistoryButton(props: { onClick: (value: number) => void }) {
  return (
    <div class="h-2 text-center align-middle">
      <div
        onClick={() => props.onClick(-1)}
        class="p-1 px-3 h-6 hover:bg-gray-200 duration-200 cursor-pointer border border-gray-300 mx-[1px] rounded truncate"
      >
        <svg
          width="10"
          height="10"
        >
          <path
            d="M 5 1 L 1 9 L 9 9 Z"
            stroke="gray"
            fill="none"
          />
        </svg>
      </div>
      <div
        onClick={() => props.onClick(1)}
        class="p-1 px-3 h-5 hover:bg-gray-200 duration-200 cursor-pointer border border-gray-300 mx-[1px] rounded truncate"
      >
        <svg
          width="10"
          height="10"
        >
          <path
            d="M 1 1 L 5 9 L 9 1 Z"
            stroke="gray"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
