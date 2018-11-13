abstract class Key {
	private keyDeb: boolean = false;
	private keyTime: Date = new Date();
	private diffTime: number = 0;

	public bindKey = () => {
		const n = new Date();
		const differenceTravel = n.getTime() - this.keyTime.getTime();
		this.diffTime = differenceTravel;
		setTimeout(() => {
			if (this.diffTime <= 200) {
				if (this.keyDeb) {
					this.onDbKey();
				}
				this.keyDeb = !this.keyDeb;
			} else {
				this.onKey();
			}
		}, 500);
		this.keyTime = n;
	};

	protected abstract onDbKey(): void;

	protected abstract onKey(): void;
}

export default Key;
