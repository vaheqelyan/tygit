import * as blessed from "blessed";
import { Inject } from "typedi";
import Screen from "./screen";

type PromptPurpose = "COMMIT" | "COMMIT FILE" | "PUSH" | "PULL" | "DELETE BRANCH" | "CREATE BRANCH" | "MERGE";

abstract class Prompt {
	@Inject(() => Screen)
	protected screenFactory: Screen;
	protected element: blessed.Widgets.TextboxElement;
	protected type: PromptPurpose;

	public prompt(label, type: PromptPurpose) {
		this.type = type;
		this.makePrompt(label);
		this.screenFactory.screen.append(this.element);
		this.element.focus();
		this.screenFactory.screen.render();
	}

	public setType(type: PromptPurpose) {
		this.type = type;
	}

	public getElement(): blessed.Widgets.TextboxElement {
		return this.element;
	}
	protected makePrompt(label) {
		this.element = blessed.textbox({
			border: "line",
			content: "",
			focusable: true,
			height: "shrink",
			inputOnFocus: true,
			keys: true,
			label,
			left: "center",
			mouse: true,
			style: {
				bar: {
					bg: "default",
					fg: "blue",
				},
				bg: "default",
				border: {
					bg: "default",
					fg: "default",
				},
				fg: "white",
			},
			tags: true,
			top: "center",
			vi: true,
			width: "half",
		});

		this.element.on("submit", this.onSubmit.bind(this));
		this.element.on("cancel", this.onCancel.bind(this));
	}
	protected abstract onSubmit(value: string): void;
	private onCancel() {
		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}
}

export default Prompt;
