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
		const diffs = this.gitFactory.getDiffs();
		const selected = this.statusFactory.getSelected();
		if (selected) {
			const getFileName = this.statusFactory.parseFileName(selected.getText());
			if (diffs.has(getFileName)) {
				const diff = diffs.get(getFileName);

				const offset = this.element.getScrollPerc();
				if (offset !== 0) {
					this.element.resetScroll();
				}

				if (diff.length > 0) {
					this.element.setContent(diff);
				} else {
					this.element.setContent("Wait a second, please...");
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
		const diffs = this.gitFactory.getDiffs();
		const fileName = this.statusFactory.getSelectedFileName();
		if (fileName) {
			if (diffs.has(fileName)) {
				this.element.setContent(diffs.get(fileName));
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
			mouse: false,
			right: 0,
			scrollable: true,
			scrollbar: {
				ch: " ",
			},
			style: {
				bg: "default",
				bold: true,
				border: {
					fg: "#f0f0f0",
				},
				fg: "white",
				hover: {
					bg: "green",
				},
			},
			tags: false,
			width: setRowForDiff(width),
		});

		el.key("C-down", this.moveListDown);

		el.key("C-up", this.moveListUp);

		return el;
	}

	public appendToScreen() {
		this.element = this.createElement();
		this.screenFactory.screen.append(this.element);
	}

	public observerForMap = path => {
		const diffs = this.gitFactory.getDiffs();

		const selected = this.statusFactory.getSelected();
		if (selected) {
			const getPath = this.statusFactory.parseFileName(selected.getText());
			if (getPath === path) {
				if (diffs.has(getPath)) {
					const getDiffResult = diffs.get(getPath);
					if (getDiffResult.length > 0) {
						this.element.setContent(getDiffResult);
						this.screenFactory.screen.render();
					}
				}
			}
		}
	};

	private moveListDown = () => {
		this.statusFactory.goDown();
		this.diffOnFocus();

		this.statusFactory.setStatusBarSelectedTitle();
		this.screenFactory.screen.render();
	};
	private moveListUp = () => {
		this.statusFactory.goUp();
		this.diffOnFocus();
		this.statusFactory.setStatusBarSelectedTitle();

		this.screenFactory.screen.render();
	};
}

export default Diff;
