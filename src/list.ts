import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import Screen from "./screen";

@Service()
export default abstract class List {
	@Inject(() => Screen)
	public screenFactory: Screen;
	protected element: blessed.Widgets.ListElement = null;

	public appendToScreen(label, items, width, height, top?: string) {
		this.makeElement(label, items, width, height, top);
		this.screenFactory.screen.append(this.element);
	}

	public makeElement(label: string, items: string[], width: string, height: string, top?: string) {
		this.element = blessed.list({
			align: "left",
			border: {
				type: "line",
			},
			height,
			invertSelected: false,
			items,
			label,
			mouse: true,
			scrollbar: {
				ch: "",
				style: {
					inverse: true,
				},
				track: {
					bg: "yellow",
				},
			},
			style: {
				bg: "default",
				border: {
					bg: "default",
					fg: "default",
				},
				fg: "default",
				selected: {
					bg: "white",
					fg: "black",
				},
			},
			tags: true,
			top,
			width,
		});
		this.element.on("keypress", this.onSelect.bind(this));
	}

	public onSelect = (ch: string, key: blessed.Widgets.Events.IKeyEventArg) => {
		if (key.name === "up" || key.name === "k") {
			this.element.up();

			if (this.onUp) {
				this.onUp();
			}
			this.screenFactory.screen.render();
			return;
		} else if (key.name === "down" || key.name === "j") {
			this.element.down();

			if (this.onDown) {
				this.onDown();
			}
			this.screenFactory.screen.render();

			return;
		} else if (key.name === "enter") {
			if (this.onEnter) {
				this.onEnter();
			}
		}
	};
	public focus() {
		this.element.focus();
	}
	public getSelected(): blessed.Widgets.BlessedElement {
		if (this.element.items.length > 0) {
			const { selected } = this.element;
			return this.element.getItem(selected);
		}
	}

	public getSelectedFileName(): string {
		const selected = this.getSelected();
		if (selected) {
			const selectedText = selected.getText();
			return this.parseFileName(selectedText);
		}
		return null;
	}

	public getSelectedBranchName(): string {
		const selBranchName = this.getSelected().getText();
		if (selBranchName.indexOf("*") !== -1) {
			return selBranchName.substring(2);
		} else {
			return selBranchName;
		}
	}
	public getElement(): blessed.Widgets.ListElement {
		return this.element;
	}

	public parseFileName(fileName: string) {
		return fileName.split(" ")[3];
	}
	public parseFileStatusType(fileName: string) {
		return fileName.split(" ")[1];
	}
	public enable() {
		this.element.addListener("keypress", this.onSelect);
	}
	public disable() {
		this.element.removeListener("keypress", this.onSelect);
	}
	protected onUp?(): void;
	protected onDown?(): void;
	protected abstract onEnter?(): void;
}
