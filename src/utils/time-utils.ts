export const timestamp = (date: Date = new Date()) => {
	return [
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
	].join("-");
};

export class Timer {
	callback: () => any;
	duration: number;
	remaining: number;
	start: Date = new Date();
	id?: number;

	constructor(callback: () => any, duration = 500) {
		this.callback = callback;
		this.duration = duration;
		this.remaining = duration;
		this.resume();
	}

	resume() {
		this.start = new Date();
		this.id = setTimeout(this.callback, this.remaining);
		return this;
	}
	
	pause() {
		clearTimeout(this.id);
		delete this.id;
		this.remaining -= new Date().getTime() - this.start.getTime();
		return this;
	}
	
	reset() {
		this.pause();
		this.remaining = this.duration;
		return this;
	}
}