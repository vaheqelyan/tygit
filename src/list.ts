import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import Screen from "./screen";

@Service()
export default abstract class List {
	@Inject(() => Screen)
	public screenFactory: Screen;
	protected element: blessed.Widgets.ListElement = null;

	public appendToScreen(label, items, width, height, top?: number) {
		this.makeElement(label, items, width, height, top);
		this.screenFactory.screen.append(this.element);
	}

	public makeElement(label: string, items: string[], width: number, height: number, top?: number) {
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
				// @ts-ignore
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
		this.element.key("down", this.onDown);
		this.element.key("up", this.onUp);

		this.element.key("enter", this.onEnter.bind(this));
	}

	public focus() {
		this.element.focus();
	}
	public getSelected(): blessed.Widgets.BlessedElement {
		// @ts-ignore
		if (this.element.items.length > 0) {
			// @ts-ignore
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
		this.element.key("up", this.onUp);
		this.element.key("down", this.onDown);
		this.element.key("enter", this.onEnter);
	}
	public disable() {
		this.element.unkey("up", this.onUp);
		this.element.unkey("down", this.onDown);
		this.element.unkey("enter", this.onEnter);
	}
	protected onSelect?(): void;

	protected abstract onEnter(): void;
	private onUp = () => {
		// @ts-ignore
		this.element.up();
		if (this.onSelect) {
			this.onSelect();
		}
	};

	private onDown = () => {
		// @ts-ignore
		this.element.down();
		if (this.onSelect) {
			this.onSelect();
		}
	};
}
