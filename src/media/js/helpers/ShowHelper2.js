import utils from '../utils/Utils.js';
import $ from 'jquery';

const IGNORE_WINDOW_WIDTH = true;
const listeners = [];
let viewportScale = 1;
let started = false;
// function ShowHelper2() {
// 	listeners = [];
// 	viewportScale = 1;
// 	started = false;

// 	// eslint-disable-line no-unused-vars
// 	/* eslint-disable */
// 	window.addEventListener(
// 		'resize',
// 		e => {
// 			this.update(true);
// 		},
// 		true
// 	);

// 	let self = this;

// 	window.addEventListener(
// 		'scroll',
// 		function() {
// 			self.update();
// 		},
// 		true
// 	);

// 	/* eslint-enable */
// }

const ShowHelper2 = {
	start() {
		started = true;
		this.update(true);
	},
	stop() {
		started = false;
	},
	watch(target, handler, hitFlag, alwaysUpdate) {
		let $target = $(target);
		let targetLength = $target.length;
		for (let k = 0; k < targetLength; k++) {
			this.watchSingle($target[k], handler, hitFlag, alwaysUpdate);
		}
	},
	staggerWatch(target, handler, hitFlag, alwaysUpdate, staggerTime) {
		if (!staggerTime || staggerTime == 0) {
			return this.watch(target, handler, hitFlag, alwaysUpdate);
		}
		let prevTime = 0;
		let $target = $(target);
		let targetLength = $target.length;
		for (let k = 0; k < targetLength; k++) {
			this.watchSingle(
				$target[k],
				(state, target) => {
					if (state) {
						let delay = 0;
						let now = utils.now();
						let timeDistance = now - prevTime;

						if (timeDistance < staggerTime) {
							delay = staggerTime - timeDistance;
						}

						prevTime = now + delay;

						setTimeout(() => {
							handler.apply(target, [true, target]);
						}, delay);
					} else {
						handler.apply(target, [false, target]);
						// TODO: Add clearTimeout somehow here
					}
				},
				hitFlag,
				alwaysUpdate
			);
		}
	},
	unwatch(target) {
		let $target = $(target);
		let targetLength = $target.length;
		for (let k = 0; k < targetLength; k++) {
			this.unwatchSingle($target[k]);
		}
	},
	reset(target) {
		let $target = $(target);
		let targetLength = $target.length;
		for (let k = 0; k < targetLength; k++) {
			this.resetSingle($target[k], false);
		}
		this.update(true);
	},
	resetSingle(target, updateAfter) {
		let totalListeners = listeners.length;
		for (let k = 0; k < totalListeners; k++) {
			let listener = listeners[k];
			if (listener.target === target) {
				listener.state = !listener.state;

				updateAfter && this.update(true);
				return;
			}
		}
	},
	watchSingle(target, handler, hitFlag, alwaysUpdate) {
		// this.unwatchSingle( target );

		let listener = {
			target: target,
			handler: handler,
			hitFlag: hitFlag,
			alwaysUpdate: !!alwaysUpdate,
		};

		listeners.push(listener);

		this._checkListener(listener, true);
	},
	unwatchSingle(target) {
		let totalListeners = listeners.length;
		for (let k = 0; k < totalListeners; k++) {
			if (listeners[k].target === target) {
				listeners.splice(k, 1);
				this.hasUnwatchAction = true;
				return;
			}
		}
	},
	update(forced) {
		if (!started) {
			return;
		}

		if (forced) {
			let width = IGNORE_WINDOW_WIDTH ? 9999999 : window.innerWidth;
			let height = window.innerHeight;
			let viewWidth = IGNORE_WINDOW_WIDTH ? width : width * viewportScale;
			let viewHeight = height * viewportScale;

			this.viewportLeft = (width - viewWidth) / 2;
			this.viewportRight = width - this.viewportLeft;
			this.viewportTop = (height - viewHeight) / 2;
			this.viewportBottom = height - this.viewportTop;
		}

		this.pageX = IGNORE_WINDOW_WIDTH ? 0 : Math.max(window.pageXOffset, document.body.scrollLeft);
		this.pageY = Math.max(window.pageYOffset, document.body.scrollTop);

		this.hasUnwatchAction = false;
		let testedListener;
		let totalListeners = listeners.length;
		for (let k = 0; k < totalListeners; k++) {
			let listener = listeners[k];
			if (listener && listener != testedListener) {
				this._checkListener(listeners[k], forced);
				testedListener = listener;
			}
			if (this.hasUnwatchAction) {
				k--;
				this.hasUnwatchAction = false;
			}
		}
		this.hasUnwatchAction = false;
	},
	setViewpostScale(scale) {
		viewportScale = scale;
		this.update(true);
	},
	_checkListener(listener, forced) {
		if (!started) {
			return;
		}

		if (forced || !listener.boundingRect || listener.alwaysUpdate) {
			let boundingClientRect = listener.target.getBoundingClientRect();
			listener.boundingRect = {
				top: boundingClientRect.top + this.pageY,
				bottom: boundingClientRect.bottom + this.pageY,
				left: boundingClientRect.left + this.pageX,
				right: boundingClientRect.right + this.pageX,
			};
		}
		let bBox = listener.boundingRect;

		let visibleState = false;
		if (listener.hitFlag) {
			visibleState =
				bBox.left < this.viewportRight + this.pageX &&
				bBox.right > this.viewportLeft + this.pageX &&
				bBox.top < this.viewportBottom + this.pageY &&
				bBox.bottom > this.viewportTop + this.pageY;
		} else {
			visibleState =
				bBox.left >= this.viewportLeft + this.pageX &&
				bBox.right <= this.viewportRight + this.pageX &&
				bBox.top >= this.viewportTop + this.pageY &&
				bBox.bottom <= this.viewportBottom + this.pageY;
		}
		if (listener.state != visibleState) {
			listener.state = visibleState;
			listener.handler.apply(listener.target, [visibleState, listener.target]);
		}
	},
};
// eslint-disable-line no-unused-vars
/* eslint-disable */
window.addEventListener(
	'resize',
	(e) => {
		ShowHelper2.update(true);
	},
	true
);

window.addEventListener(
	'scroll',
	function () {
		ShowHelper2.update();
	},
	true
);
export default ShowHelper2;
