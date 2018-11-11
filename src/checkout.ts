import { Inject } from "typedi";

import Git from "./git";
import Screen from "./screen";
import Status from "./status";

class Checkout {
	@Inject(() => Status)
	private statusFactory: Status;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject() private gitFactory: Git;

	private spawnResponse: string;

	public checkout() {
		const getFlag = this.statusFactory.getFlag();
		if (getFlag) {
			if (!/(UD|UA|AA|DD|D|A|\?\?)/g.test(getFlag)) {
				const fileName = this.statusFactory.getSelectedFileName();
				this.spawnResponse = null;
				this.gitFactory.checkoutChanges(fileName, this.setSpawnResponse, this.onClose);
			}
		}
	}

	private setSpawnResponse = (response: Buffer) => {
		this.spawnResponse = response.toString();
	};

	private onClose = (code: number) => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.screenFactory.updateFactory.updateAfterCheckout(this.statusFactory.getSelectedFileName());
		}
	};
}

export default Checkout;
