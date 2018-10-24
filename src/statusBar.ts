import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import writeStatusBarContent from "./fn/writeStatusBarContent";
import Git from "./git";
import MSG from "./messages/statusBar";
import Screen from "./screen";

import { setColumnForStatusBar, setRowForStatusBar, STATUS_BAR_HEIGHT } from "./fn/layout";

@Service()
class StatusBar {
	public element: blessed.Widgets.BoxElement;
	@Inject(() => Git)
	public gitFactory: Git;

	@Inject(() => Screen)
	public screenFactory: Screen;

	public getElement() {
		return this.element;
	}

	public appendAndRender() {
		this.element = this.createElement();
		this.screenFactory.screen.append(this.element);
		this.screenFactory.screen.render();
	}
	public toogleContent(val1: string, val2: string = "", ms: number = 1800) {
		this.setTitleAndRender(val1);

		setTimeout(() => {
			this.setTitleAndRender(val2);
		}, ms);
	}

	public resetContent(r: boolean = true) {
		this.setTitle();
		if (r) {
			this.screenFactory.screen.render();
		}
	}

	public setTitle(title?: string) {
		const dS = this.gitFactory.getDiffSummary();
		if (dS) {
			const { insertions, deletions } = dS;
			this.element.setContent(writeStatusBarContent(this.gitFactory.getCurrentBranch(), insertions, deletions, title));
		}
	}

	public setTitleAndRender(title: string, ren: boolean = true) {
		this.setTitle(title);
		if (ren) {
			this.screenFactory.screen.render();
		}
	}

	public reload() {
		this.toogleContent(MSG.RELOADED);
	}

	public setFileTitle(filePath: string, fileStatus: string | "?" | "A" | "M" | "D" | "R" | "U") {
		let edit = "";
		switch (fileStatus) {
			case "?":
				edit = `{red-bg} {white-fg}{bold}?{/bold}{/white-fg} {/red-bg} ${filePath}`;
				break;

			case "A":
				edit = `{green-bg} {white-fg}{bold}A{/bold}{/white-fg} {/green-bg} ${filePath}`;
				break;

			case "M":
				edit = `{yellow-bg} {white-fg}{bold}M{/bold}{/white-fg} {/yellow-bg} ${filePath}`;
				break;

			case "D":
				edit = `{red-bg} {white-fg}{bold}D{/bold}{/white-fg} {/red-bg} ${filePath}`;
				break;

			case "R":
				edit = `{red-bg} {white-fg}{bold}R{/bold}{/white-fg} {/red-bg} ${filePath}`;
				break;

			case "U":
				edit = `{red-bg} {white-fg}{bold}U{/bold}{/white-fg} {/red-bg} ${filePath}`;
				break;
		}
		this.setTitle(edit);
	}

	public createElement() {
		const statusBar = blessed.box({
			border: "line",
			content: MSG.LOADING,
			height: STATUS_BAR_HEIGHT,
			tags: true,
			top: setColumnForStatusBar(this.screenFactory.getTerminalHeight()),
			width: setRowForStatusBar(this.screenFactory.getTerminalWidth()),
		});

		return statusBar;
	}

	public appendToScreen() {
		this.element = this.createElement();
		this.screenFactory.screen.append(this.element);
	}
	public loaded() {
		this.toogleContent(MSG.LOADED);
	}
}

export default StatusBar;
