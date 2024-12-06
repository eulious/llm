/* @refresh reload */
import { render } from "solid-js/web";
import LLM from "./LLM";
import "./index.css";

window.onload = () => {
  render(() => <LLM />, document.getElementById("root")!);
};
