import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import Git from "./git";
import Screen from "./screen";
import Status from "./status";

import { setColumnForDiff, setDiffRowPosition, setRowForDiff } from "./fn/layout";

@Service()
class Diff {
	public element: blessed.Widgets.BoxElement;

	@Inject(() => Status)
	public statusFactory: Status;
	@Inject() public gitFactory: Git;
	@Inject(() => Screen)
	public screenFactory: Screen;

	public diffOnFocus() {
		const selected = this.statusFactory.getSelected();
		if (selected) {
			const getFileName = this.statusFactory.parseFileName(selected.getText());
			if (this.gitFactory.diffs.has(getFileName)) {
				const diff = this.gitFactory.diffs.get(getFileName);
				if (diff.length > 0) {
					this.element.setContent(diff);
				} else {
					this.element.setContent("wait diffing ....");
				}
			}
		}
	}

	public appendAndRender() {
		this.element = this.createElement();
		this.screenFactory.screen.append(this.element);
		this.screenFactory.screen.render();
	}
	public reload() {
		const fileName = this.statusFactory.getSelectedFileName();
		if (fileName) {
			if (this.gitFactory.diffs.has(fileName)) {
				this.element.setContent(this.gitFactory.diffs.get(fileName));
			}
		}
	}
	public createElement() {
		const { width, height } = this.screenFactory.getTerminalSize();
		const el = blessed.box({
			alwaysScroll: true,
			border: {
				type: "line",
			},
			content: ``,
			height: setColumnForDiff(height),
			keys: true,
			label: "Diff",
			left: setDiffRowPosition(width),
			mouse: true,
			right: 0,
			scrollable: true,
			scrollbar: {
				ch: " ",
			},
			style: {
				bg: "default",
				border: {
					fg: "#f0f0f0",
				},
				fg: "white",
				hover: {
					bg: "green",
				},
			},
			tags: true,
			width: setRowForDiff(width),
		});

		return el;
	}
	public getElement() {
		return this.element;
	}

	public appendToScreen() {
		this.element = this.createElement();
		this.screenFactory.screen.append(this.element);
	}
	public observerForMap = path => {
		const selected = this.statusFactory.getSelected();
		if (selected) {
			const getPath = this.statusFactory.parseFileName(selected.getText());
			if (getPath === path) {
				if (this.gitFactory.diffs.has(getPath)) {
					const getDiffResult = this.gitFactory.diffs.get(getPath);
					if (getDiffResult.length > 0) {
						this.element.setContent(getDiffResult);
						this.screenFactory.screen.render();
					}
				}
			}
		}
	};
}

export default Diff;
