import * as blessed from "blessed";
import { Inject } from "typedi";
import Status from "./status";

import Branches from "./branch";
import Diff from "./diff";
import Git from "./git";
import StatusBar from "./statusBar";

import * as fuzzysearch from "fuzzysearch";
import buildStatusArray from "./fn/buildStatusArray";
import MergePrompt from "./mergePrompt";
import Message from "./message";
import MSG from "./messages/statusBar";
import PullInput from "./pullPrompt";
import PushInput from "./pushPrompt";

export default class Screen {
	public CtrlPPress = new Date();

	public PPress = new Date();

	public pushDeb = false;
	public diffTime = 0;

	@Inject() public gitFactory: Git;
	@Inject(() => Branches)
	public branchFactory: Branches;

	@Inject(() => MergePrompt)
	public mergePrompt: MergePrompt;

	@Inject() public statusFactory: Status;

	@Inject() public statusBarFactory: StatusBar;
	@Inject(() => Diff)
	public diffFactory: Diff;
	public screen: blessed.Widgets.Screen = this.createScreen();

	@Inject() public pullInput: PullInput;

	@Inject() public pushInput: PushInput;

	public times: number = 0;

	@Inject(() => Message)
	public msgFactory: Message;

	public curElement: string | "Status" | "Diff" | "Branches";

	public initStateAndRender() {
		this.branchFactory.appendToScreen("Branches", [], "30%", "20%");
		this.statusFactory.appendToScreen("Status", [], "30%", "75%", "20%");
		this.diffFactory.appendToScreen();
		this.statusBarFactory.appendToScreen();

		this.gitFactory.initBranches(() => {
			this.branchFactory.reload();
		});
		this.gitFactory.initStatus(() => {
			this.statusFactory.reload();
		});

		this.gitFactory.asyncDiff((err, data) => {
			if (err) {
				console.log(err);
			}
			this.gitFactory.prettyDiff(data);

			this.diffFactory.reload();
		});
		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.loaded();
		});
		this.applyEvents();

		this.branchFactory.focus();

		this.screen.screen.render();
	}
	public createScreen() {
		const screen = blessed.screen({
			autoPadding: true,
			cursor: {
				artificial: false,
				blink: true,
				color: null,
				shape: "line",
			},
			debug: true,
			dockBorders: true,
			resizeTimeout: 300,
			title: "widget test",
			warnings: false,
		});
		screen.key(["escape", "q"], () => {
			return process.exit(0);
		});
		return screen;
	}
	public applyEvents() {
		this.screen.on("element focus", this.onFocus.bind(this));
		this.screen.on("keypress", this.onKeyPress.bind(this));
		this.screen.key("C-r", this.reload);
		this.screen.key("C-c", () => {
			this.statusFactory.commit();
		}); // Commit
		this.screen.key("m", this.merge);
		this.screen.key("C-b", () => {
			this.branchFactory.createNewBranch();
		});
		this.screen.key("C-d", () => {
			this.branchFactory.deleteBranch();
		});
		this.screen.key("C-a", () => {
			this.statusFactory.trackFiles();
		}); // Track files
		this.screen.key("C-p", this.ctrlPKey); // Pull
		this.screen.key("p", this.pushKey); // Push
	}

	public onFocus(cur: blessed.Widgets.BlessedElement, old: blessed.Widgets.BlessedElement) {
		if (old.border) {
			old.style.border.bold = false;
			old.setLabel(old.options.label);
		}
		if (cur.border) {
			this.curElement = cur.options.label;
			cur.style.border.bold = true;
			cur.setLabel(`{bold}${cur.options.label}{/bold}`);
			if (cur.options.label === "Status") {
				this.statusFactory.setStatusBarSelectedTitle();
				this.diffFactory.diffOnFocus();
			}
			this.screen.render();
		}
	}
	public onKeyPress(ch: string, key: blessed.Widgets.Events.IKeyEventArg) {
		if (key.name === "tab") {
			return key.shift ? this.screen.focusPrevious() : this.screen.focusNext();
		}
		if (key.name === "escape" || key.name === "q") {
			return process.exit(0);
		}
	}
	public handlePull = () => {
		this.statusBarFactory.setTitleAndRender(MSG.PULLED);
		this.gitFactory.initStatus(() => {
			this.statusFactory.reload();
			this.screen.render();
		});
		this.gitFactory.asyncDiff((err, data) => {
			if (err) {
				console.log(err);
			}
			this.gitFactory.prettyDiff(data);
			this.diffFactory.diffOnFocus();
			this.screen.render();
		});
		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.resetContent();
		});
	};
	public handlePullError = err => {
		this.msgFactory.display(err, (msgErr, value) => {
			if (msgErr) {
				console.log(msgErr);
			}
			if (value) {
				this.statusBarFactory.resetContent();
				this.screen.screen.remove(this.msgFactory.element);
				this.screen.screen.render();
			}
		});
	};
	public ctrlPKey = () => {
		const n = new Date();
		const differenceTravel = n.getTime() - this.CtrlPPress.getTime();
		this.diffTime = differenceTravel;
		setTimeout(() => {
			if (this.diffTime <= 200) {
				if (this.pushDeb) {
					this.pullInput.prompt("Pull", "PULL");
				}
				this.pushDeb = !this.pushDeb;
			} else {
				this.pull();
			}
		}, 500);
		this.CtrlPPress = n;
	};

	public pushKey = () => {
		const n = new Date();
		const differenceTravel = n.getTime() - this.PPress.getTime();
		this.diffTime = differenceTravel;
		setTimeout(() => {
			if (this.diffTime <= 200) {
				if (this.pushDeb) {
					console.log("push input");
					this.pushInput.prompt("Push", "PUSH");
				}
				this.pushDeb = !this.pushDeb;
			} else {
				this.push();
			}
		}, 500);
		this.PPress = n;
	};
	public alertError(err) {
		this.msgFactory.display(err, (msgErr, value) => {
			if (msgErr) {
				console.log(msgErr);
			}
			if (value) {
				this.statusBarFactory.resetContent();
				this.screen.screen.remove(this.msgFactory.element);
				this.screen.screen.render();
			}
		});
	}
	public handlePush = data => {
		const str = data.toString("utf8");
		if (fuzzysearch("fatal", str)) {
			this.alertError(str);
		} else if (fuzzysearch("reject", str)) {
			this.alertError(str);
		} else {
			this.statusBarFactory.toogleContent("Ok::Pushed");
		}
	};
	public push() {
		this.gitFactory.pushNoArgs(this.handlePush);
		this.statusBarFactory.setTitleAndRender(MSG.PUSHING);
	}
	public pull() {
		this.statusBarFactory.setTitleAndRender(MSG.PULLING);
		this.gitFactory.pullNoArgs(this.handlePull, this.handlePullError);
	}

	public reload = (all?: boolean) => {
		if (this.curElement === "Status" && all === undefined) {
			this.statusBarFactory.setTitleAndRender(MSG.RELOAD_STATUS);
			this.gitFactory.initStatus(() => {
				this.statusFactory.reload();
				this.screen.render();
			});
			this.gitFactory.asyncDiff((err, data) => {
				if (err) {
					console.log(err);
				}
				this.gitFactory.prettyDiff(data);
				this.diffFactory.diffOnFocus();
				this.statusBarFactory.toogleContent(MSG.STATUS_RELOADED);
				this.screen.render();
			});
		} else {
			this.statusBarFactory.setTitleAndRender(MSG.RELOAD);
			this.gitFactory.initBranches(() => {
				this.branchFactory.reload();
				this.screen.render();
			});
			this.gitFactory.initStatus(() => {
				this.statusFactory.reload();
				this.screen.render();
			});
			this.gitFactory.asyncDiff((err, data) => {
				if (err) {
					console.log(err);
				}
				this.gitFactory.prettyDiff(data);
				this.diffFactory.diffOnFocus();
				this.screen.render();
			});
			this.gitFactory.initDiffSummary(() => {
				this.statusBarFactory.reload();
				this.screen.render();
			});
		}
	};

	public merge = () => {
		this.mergePrompt.prompt("Merging with branch", "MERGE");
	};
}
