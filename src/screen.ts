import * as blessed from "blessed";
import { Inject } from "typedi";
import Status from "./status";

import Branches from "./branch";
import Git from "./git";
import LogWidget from "./log/logWidget";
import StatusBar from "./statusBar";

import MergePrompt from "./mergePrompt";
import Message from "./message";

import Pull from "./pull";

import Push from "./push";

import Update from "./update";

import {
	setColumnForDiff,
	setColumnForStatus,
	setDiffRowPosition,
	setLeftColumn,
	setLeftRow,
	setRowForDiff,
	setTopForStatus,
} from "./fn/layout";

export default class Screen {
	@Inject() public gitFactory: Git;
	public screen: blessed.Widgets.Screen;

	public curElement: "Status" | "Log" | "Branches";
	@Inject(() => Update)
	public updateFactory: Update;
	@Inject(() => Branches)
	private branchFactory: Branches;

	@Inject(() => MergePrompt)
	private mergePrompt: MergePrompt;

	@Inject() private statusFactory: Status;

	@Inject() private statusBarFactory: StatusBar;
	@Inject(() => LogWidget)
	private logWidgetFactory: LogWidget;

	@Inject(() => Message)
	private msgFactory: Message;

	@Inject() private pushFactory: Push;

	@Inject(() => Pull)
	private pullFactory: Pull;

	private terminalEncode: string;

	private terminalSize: { width: number; height: number };
	constructor(container) {
		this.terminalEncode = container.get("terminal");
		this.terminalSize = container.get("terminal-size");
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
		this.logWidgetFactory.appendToScreen(
			"Log",
			[],
			setRowForDiff(width),
			setColumnForDiff(height),
			0,
			setDiffRowPosition(width),
		);
		this.statusBarFactory.appendToScreen();

		this.gitFactory.initBranches(() => {
			this.branchFactory.reload();
		});

		this.gitFactory.status(() => {
			this.statusFactory.reload();
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
			fastCSR: true,
			resizeTimeout: 300,
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
		const statusElement = this.statusFactory.getElement();

		this.screen.on("element focus", this.onFocus.bind(this));
		this.screen.on("keypress", this.onKeyPress.bind(this));
		this.screen.key("C-l", () => {
			this.branchFactory.jumpToLogs();
		});
		this.logWidgetFactory.getElement().key("C-r", () => this.logWidgetFactory.reload());
		this.screen.key("C-r", () => this.updateFactory.updateAll);
		this.screen.key("C-c", () => {
			this.statusFactory.commit();
		}); // Commit
		statusElement.key("r", () => this.statusFactory.rm());
		this.screen.key("m", this.merge);
		this.screen.key("C-b", () => {
			this.branchFactory.createNewBranch();
		});
		statusElement.key("C-r", () => this.updateFactory.reloadStatus());
		this.screen.key("C-d", () => {
			this.branchFactory.deleteBranch();
		});
		this.screen.key("C-a", () => {
			this.statusFactory.trackFiles();
		}); // Track files
		statusElement.key("left", () => {
			this.statusFactory.checkoutFile();
		});
		this.screen.key("C-p", this.pullFactory.bindKey); // Pull
		this.screen.key("p", this.pushFactory.bindKey); // Push
		statusElement.free();
		statusElement.key("i", () => {
			this.statusFactory.ignore();
		});
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
			const { label } = cur.options;
			this.curElement = label as any;
			cur.style.border.bold = true;
			if (label === "Status") {
				this.statusFactory.setStatusBarSelectedTitle();
				this.logWidgetFactory.logOnFocus();
			}
			if (label === "Log") {
				this.logWidgetFactory.setStatusBarOnFocus();
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

	public alertError(err: string) {
		this.statusBarFactory.resetContent();
		this.msgFactory.display(err.trim(), (msgErr, value) => {
			if (msgErr) {
				console.log(msgErr);
			}
			if (value) {
				this.screen.remove(this.msgFactory.getElement());
				this.screen.focusNext();
				this.screen.render();
			}
		});
	}

	public merge = () => {
		this.mergePrompt.prompt("Merging with branch", "MERGE");
	};
}
