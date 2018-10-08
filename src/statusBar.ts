import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import writeStatusBarContent from "./fn/writeStatusBarContent";
import Git from "./git";
import MSG from "./messages/statusBar";
import Screen from "./screen";

@Service()
class StatusBar {
	public element: blessed.Widgets.BoxElement;
	@Inject(() => Git)
	public gitFactory: Git;

	@Inject(() => Screen)
	public screen: Screen;

	public getElement() {
		return this.element;
	}
	public z() {
		console.log("asdasd", this);
	}
	public appendAndRender() {
		this.element = this.createElement();
		this.screen.screen.append(this.element);
		this.screen.screen.render();
	}
	public toogleContent(val1: string, val2: string = "", ms: number = 1800) {
		this.element.setContent(
			writeStatusBarContent(
				this.gitFactory.branches.current,
				this.gitFactory.diffSummary.insertions,
				this.gitFactory.diffSummary.deletions,
				val1,
			),
		);
		this.screen.screen.render();

		setTimeout(() => {
			this.element.setContent(
				writeStatusBarContent(
					this.gitFactory.branches.current,
					this.gitFactory.diffSummary.insertions,
					this.gitFactory.diffSummary.deletions,
					val2,
				),
			);
			this.screen.screen.render();
		}, ms);
	}

	public resetContent(r: boolean = true) {
		this.element.setContent(
			writeStatusBarContent(
				this.gitFactory.branches.current,
				this.gitFactory.diffSummary.insertions,
				this.gitFactory.diffSummary.deletions,
			),
		);
		if (r) {
			this.screen.screen.render();
		}
	}

	public setTitleAndRender(title: string, ren: boolean = true) {
		this.element.setContent(
			writeStatusBarContent(
				this.gitFactory.branches.current,
				this.gitFactory.diffSummary.insertions,
				this.gitFactory.diffSummary.deletions,
				title,
			),
		);
		if (ren) {
			this.screen.screen.render();
		}
	}

	public reload() {
		this.toogleContent(MSG.RELOAD);
	}

	public setFileTitle(filePath: string, fileStatus: string | "?" | "A" | "M" | "D" | "R" | "U", res: boolean = true) {
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

		this.setTitleAndRender(edit, res);
	}

	public createElement() {
		const statusBar = blessed.box({
			border: "line",
			bottom: 0,
			content: MSG.LOADING,
			height: "shrink",
			tags: true,
			width: "99%",
		});

		return statusBar;
	}

	public appendToScreen() {
		this.element = this.createElement();
		this.screen.screen.append(this.element);
	}
	public loaded() {
		this.toogleContent(MSG.LOADED);
	}
}

export default StatusBar;
