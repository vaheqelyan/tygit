import * as blessed from "blessed";
import { Inject } from "typedi";
import Status from "./status";

import Branches from "./branch";
import Diff from "./diff";
import Git from "./git";
import StatusBar from "./statusBar";

import * as fuzzysearch from "fuzzysearch";
import MergePrompt from "./mergePrompt";
import Message from "./message";
import MSG from "./messages/statusBar";
import PullInput from "./pullPrompt";
import PushInput from "./pushPrompt";

import * as size from "window-size";

import { setColumnForStatus, setLeftColumn, setLeftRow, setTopForStatus } from "./fn/layout";

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
	public screen: blessed.Widgets.Screen;

	@Inject() public pullInput: PullInput;

	@Inject() public pushInput: PushInput;

	public times: number = 0;

	@Inject(() => Message)
	public msgFactory: Message;

	public curElement: string | "Status" | "Diff" | "Branches";

	private terminalEncode: string;
	private pullDataRes: string = null;

	private terminalSize: { width: number; height: number };
	constructor(container) {
		this.terminalEncode = container.get("terminal");
		this.screen = this.createScreen();
	}

	public getTerminalWidth() {
		return this.terminalSize.width;
	}

	public getTerminalHeight() {
		return this.terminalSize.height;
	}

	public getTerminalSize() {
		return this.terminalSize;
	}

	public initStateAndRender() {
		const { width, height } = this.terminalSize;
		this.branchFactory.appendToScreen("Branches", [], setLeftRow(width), setLeftColumn(height));
		this.statusFactory.appendToScreen(
			"Status",
			[],
			setLeftRow(width),
			setColumnForStatus(height),
			setTopForStatus(height),
		);
		this.diffFactory.appendToScreen();
		this.statusBarFactory.appendToScreen();

		this.gitFactory.initBranches(() => {
			this.branchFactory.reload();
		});

		this.gitFactory.status(() => {
			this.statusFactory.reload();
			this.gitFactory.startDiffing(this.diffFactory.observerForMap);
		});

		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.loaded();
		});
		this.applyEvents();

		this.branchFactory.focus();

		this.screen.screen.render();
	}
	public createScreen() {
		this.terminalSize = size;
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
			fastCSR: true,
			resizeTimeout: 300,
			title: "widget test",
			warnings: false,
		});

		const osType = process.platform;
		if (this.terminalEncode) {
			screen.setTerminal(this.terminalEncode);
		} else {
			switch (osType) {
				case "win32":
					screen.setTerminal("windows-ansi");
					break;

				case "darwin":
					screen.setTerminal("xterm-256color");
					break;

				default:
					screen.setTerminal("linux");
			}
		}

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

		this.screen.key(["q", "escape"], this.exit);
	}

	public exit() {
		process.exit();
	}

	public onFocus(cur: blessed.Widgets.BlessedElement, old: blessed.Widgets.BlessedElement) {
		if (old.border) {
			old.style.border.bold = false;
			old.setLabel(old.options.label);
		}
		if (cur.border) {
			const { label } = cur.options.label;
			this.curElement = label;
			cur.style.border.bold = true;
			if (label === "Diff") {
				// @ts-ignore
				// Parsing tags using helper
				// Because tags are disabled for Widget-widget
				cur.setLabel(blessed.parseTags(`{bold}Diff{/bold}`));
			} else {
				cur.setLabel(`{bold}${cur.options.label}{/bold}`);
			}
			if (label === "Status") {
				this.statusFactory.setStatusBarSelectedTitle();
				this.diffFactory.diffOnFocus();
			}
			this.screen.render();
		}
	}
	public onKeyPress() {
		const key: blessed.Widgets.Events.IKeyEventArg = arguments[1];
		if (key.name === "tab") {
			return key.shift ? this.screen.focusPrevious() : this.screen.focusNext();
		}
	}
	public handlePullClose = () => {
		if (fuzzysearch("CONFLICT", this.pullDataRes)) {
			this.statusBarFactory.toogleContent(MSG.PULLED_WITH_CONFLICT);
		} else {
			this.statusBarFactory.toogleContent(MSG.PULLED);
		}

		this.reloadFn(true, false);
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
		this.statusBarFactory.resetContent();
		this.msgFactory.display(err, (msgErr, value) => {
			if (msgErr) {
				console.log(msgErr);
			}
			if (value) {
				this.screen.remove(this.msgFactory.element);
				this.screen.render();
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
		this.gitFactory.pullNoArgs(this.handlePull, this.handlePullClose);
	}

	public reloadFn = (forceStatus: boolean = false, showTitle: boolean = true) => {
		if (this.curElement === "Status" || forceStatus) {
			if (showTitle) {
				this.statusBarFactory.setTitleAndRender(MSG.RELOAD);
			}
			this.gitFactory.status(() => {
				this.statusFactory.reload(false);
				this.gitFactory.startDiffing(this.diffFactory.observerForMap);
				if (showTitle) {
					this.statusBarFactory.toogleContent(MSG.RELOADED);
				}
				this.screen.render();
			});
		} else {
			this.statusBarFactory.setTitleAndRender(MSG.RELOAD);
			this.gitFactory.initBranches(() => {
				this.branchFactory.reload();
				this.screen.render();
			});
			this.gitFactory.status(() => {
				this.statusFactory.reload();
				this.gitFactory.startDiffing(this.diffFactory.observerForMap);
				this.statusBarFactory.toogleContent(MSG.RELOADED);
				this.screen.render();
			});
			this.gitFactory.initDiffSummary(() => {
				this.statusBarFactory.reload();
				this.screen.render();
			});
		}
	};

	public reload = () => {
		this.reloadFn();
	};

	public merge = () => {
		this.mergePrompt.prompt("Merging with branch", "MERGE");
	};
	private handlePull = (data: Buffer) => {
		this.pullDataRes = data.toString("utf8");
	};
}
