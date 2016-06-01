/*
Arithmisha
(c) miktim@mail.ru
   2016 released as WEB App
   2002 idea, characters, Windows App
*/
var settings = {
	bitmask: 3 + 16 + 256, // operations:addition & subtraction; order of magnitude: ones; find: result
	min2nd: 1, // 2nd operand from
	max2nd: 9, // 2nd operand to
	save: function() {
		saveData("Settings", this.get());
		currentTask.reset();
		daybook.reset();
	},
	get: function() {
		return this.bitmask + "$" + this.min2nd + "$" + this.max2nd;
	},
	restore: function() {
		var settingsStr = restoreData("Settings");
		if (settingsStr === undefined) settingsStr = this.get();
		var settingsArr = settingsStr.split("$");
		this.bitmask = Number(settingsArr[0]);
		// for each checkbox class assign
		var checkClassNames = ["setOp", "setOrder", "setFind"];
		for (var j = 0; j < checkClassNames.length; j++) {
			var checkGrp = document.getElementsByClassName(checkClassNames[j]);
			for (var i = 0; i < checkGrp.length; i++) {
				// assign state (checked/unchecked) from settings
				if (this.bitmask & checkGrp[i].value) {
					checkGrp[i].checked = true;
				} else {
					checkGrp[i].checked = false;
				};
			}
		}
		this.setMin2nd(Number(settingsArr[1]));
		this.setMax2nd(Number(settingsArr[2]));
	},
	setMin2nd: function(num) {
		this.min2nd = num;
		document.getElementById("minOpd2nd").innerHTML = num;
	},
	setMax2nd: function(num) {
		this.max2nd = num;
		document.getElementById("maxOpd2nd").innerHTML = num;
	},
	update2ndValues: function() {
		var min2 = Number(document.getElementById("minOpd2nd").innerHTML);
		var max2 = Number(document.getElementById("maxOpd2nd").innerHTML);
		if (min2 == 0) min2 = 1;
		if (max2 == 0) max2 = 9;
		if (min2 > max2) max2 = min2;
		this.setMin2nd(min2);
		this.setMax2nd(max2);
		this.save();
	}
}
//
var currentField = {
	element: undefined,
	maxLen: 0,
	chars: "",
	onChange: function() {},
	setElement: function(element) {
		this.reset();
		this.element = element;
		this.element.className = "edited";
	},
	set: function(element, len, chars, handle) {
		this.setElement(element);
		this.maxLen = len;
		this.chars = chars;
		this.onChange = handle;
	},
	reset: function() {
		if (this.element === undefined) return;
		this.element.className = "editable";
		this.element = undefined;
	},
	inKey: function(key) {
		if (this.element === undefined) return;
		var inValue = decodeHTML(this.element.innerHTML); //&GT; &LT;
		var inLen = inValue.length;
		if (key == "B" && inLen > 0) { //Backspace
			this.element.innerHTML = inValue.substr(0, inLen - 1);
			return;
		}
		if (key == "E") {  //Enter
			if (inLen > 0 && typeof this.onChange === "function") {
				this.onChange();
			}
			return;
		}
		if (inLen >= this.maxLen) return;
		if (this.chars.indexOf(key) < 0) return; // char enabled?
		if (key == "." && inValue.search(".") > 0) return;
		this.element.innerHTML += key;
	}
};
//
var currentTask = {
	timeSec: -1,
	examples: new Array(),
	exIndex: -1,
	started: undefined,
	errCount: 0,
	set: function(strTask) {
		this.examples = strTask.split(",");
		this.timeSec = Number(this.examples.shift());
	},
	get: function() {
		return String(this.timeSec) + "," + this.examples;
	},
	show: function() {
		if (this.examples.length == 0) this.generate();
		this.errCount = 0;
		var firstQuestion = true;
		document.getElementById("varResult").innerHTML = "";
		for (var i = 0; i < this.examples.length; i++) {
			var exAr = this.examples[i].split(" ");
			this.showExample(i);
			if (firstQuestion && exAr[exAr[6]] == "?") {
				document.getElementById("varTaskNo").innerHTML = "";
				firstQuestion = false;
				if (i == 0) {
					this.started = (new Date()).getTime();
				}
				this.getAnswer(i);
			}
		}
		if (firstQuestion) {
			document.getElementById("varResult").innerHTML = resFormat
				.replace("%t", currentTask.timeSec)
				.replace("%e", currentTask.errCount);
		}
	},
	getAnswer: function(i) {
		if (i < this.examples.length) {
			this.exIndex = i;
			var exAr = this.examples[i].split(" ");
			var charset = "1234567890.";
			if (exAr[6] == 1) {
				charset = "/*-+";
			}
			if (exAr[6] == 3) {
				charset = "=><";
			}
			var el = document.getElementById("e" + String(i) + exAr[6]);
			el.innerHTML = "";
			currentField.set(el, exAr[5].length, charset, function() {
				var i = currentTask.exIndex;
				var answer = decodeHTML(currentField.element.innerHTML);
				if (!isNaN(parseFloat(answer)) && isFinite(answer)) {
					answer = roundToTenths(Number(answer)).toString();
				}
				currentTask.examples[i] =
					currentTask.examples[i].replace("?", answer);
				currentField.reset();
				currentTask.showExample(i);
				currentTask.getAnswer(i + 1);
				if (i == (currentTask.examples.length - 1)) {
					currentTask.timeSec = Math.round(((new Date()).getTime() - currentTask.started) / 1000);
					resetData("Task");
					daybook.addTask(currentTask.get());
					currentTask.show();
					playAnimation();
				}
			});
		}
	},
	showExample: function(i) {
		var exArr = this.examples[i].split(" ");
		var tdElAnswer = document.getElementById("e" + String(i) + "5");
		tdElAnswer.innerHTML = "";
		tdElAnswer.className = "rightAnswer";
		for (var j = 0; j < 5; j++) {
			var tdEl = document.getElementById("e" + String(i) + String(j));
			tdEl.innerHTML = exArr[j];
			if (exArr[j] == "?") {
				tdEl.className = "editable";
			} else {
				if (j == exArr[6]) {
					if (exArr[j] !== exArr[5]) {
						currentTask.errCount += 1;
						tdElAnswer.innerHTML = exArr[5];
						tdEl.className = "wrongAnswer";
						//							tdEl.innerHTML = '<span class="wrongAnswer">' + exArr[j]
						//							   + '</span><span class="rightAnswer"> '+ exArr[5] + '</span>';
					} else {
						tdEl.className = "rightAnswer";
					}
				} else {
					tdEl.className = "normal";
				}
			}
		}
	},
	reset: function() {
		this.examples = new Array();
		this.timeSec = -1;
		resetData("Task");
	},
	generate: function() {
		var str = restoreData("Task");
		if (str !== undefined) {
			this.set(str);
			return;
		}
		this.reset();
		this.examples = generateTask();
		saveData("Task", this.get());
	}
};
//
var daybook = {
	tasks: new Array(),
	tsIndex: -1,
	addTask: function(taskStr) {
		if (this.tasks.length == 4) {
			this.tasks.shift();
		}
		this.tasks.push(taskStr);
		var str = this.tasks[0];
		for (var i = 1; i < this.tasks.length; i++) {
			str += ";" + this.tasks[i];
		}
		saveData("Daybook", str);
		this.tsIndex = this.tasks.length - 1;
	},
	restore: function() {
		var str = restoreData("Daybook");
		if (str !== undefined) {
			this.tasks = str.split(";");
			this.tsIndex = this.tasks.length - 1;
		}
	},
	reset: function() {
		this.tasks = new Array();
		this.tsIndex = -1;
		resetData("Daybook");
	},
	showPrevTask: function() {
		if (this.tasks.length == 0) return;
		this.tsIndex -= 1;
		if (this.tsIndex < 0) this.tsIndex = this.tasks.length - 1;
		document.getElementById("varTaskNo").innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + (this.tsIndex + 1) + "/" + this.tasks.length;
		document.getElementById("divKeyboard").style.visibility = "hidden";
		currentTask.set(this.tasks[this.tsIndex]);
		currentTask.show();
	}
};
// estimate results
//
var resFormat = "%t sec, %e errors";
//
function postLoadInit() {
	document.getElementById("aboutApp").innerHTML = document.title;
	document.getElementById("keyMul").value = document.getElementById("keyMul").innerHTML;
	document.getElementById("keyDiv").value = document.getElementById("keyDiv").innerHTML;
	document.getElementById("areaTeacher").onclick =
		function() {
			clickTeacher();
			return false; //disable default action
	};

	document.getElementById("areaMisha").onclick =
		function() {
			clickMisha();
			return false; //disable default action
	};

	document.getElementById("areaBlackboard").onclick =
		function() {
			clickBlackboard();
			return false; //disable default action
	};

	document.getElementById("areaMap").onclick =
		function() {
			document.getElementById("divAbout").style.visibility = "visible";
			return false; //disable default action
	};
	document.getElementById("areaPupils").onclick =
		function() {
			clickPupils();
			return false; //disable default action
	};
	daybook.restore();
	settings.restore();
	// for each checkbox in settings scene assign onclick handler
	var checkClassNames = ["setOp", "setOrder", "setFind"];
	for (var j = 0; j < checkClassNames.length; j++) {
		var checkGrp = document.getElementsByClassName(checkClassNames[j]);
		for (var i = 0; i < checkGrp.length; i++) {
			// assign onclick handler
			checkGrp[i].onclick = function(event) {
				return checkClickHandle(event);
			}
		}
	}
	// for virtual keyboard buttons assign onclick handler
	var keyClassNames = ["keyButton", "keyButtonWide"];
	for (var j = 0; j < keyClassNames.length; j++) {
		var keyGrp = document.getElementsByClassName(keyClassNames[j]);
		for (var i = 0; i < keyGrp.length; i++) {
			keyGrp[i].onclick = function(event) {
				return keyClickHandle(event);
			};
		}
	}
	document.getElementById("divHelp").style.visibility = "visible";
};
/*
 * Event Handlers
 */
// CheckBoxes onclick handler
function checkClickHandle(event) {
	var el = event.currentTarget;
	// target state already changed
	if (!el.checked) {
		// prevent all checkboxes in group unchecked
		var elClassGrp = document.getElementsByClassName(el.className);
		var checkedCnt = 0;
		for (var i = 0; i < elClassGrp.length; i++) {
			if (el !== elClassGrp[i] && elClassGrp[i].checked) checkedCnt++;
		};
		// all unchecked? - cancel change
		if (checkedCnt == 0) {
			el.checked = true;
			return false;
		}
	}
	settings.bitmask = settings.bitmask ^ el.value;
	settings.save();
	return true;
}
// Virtual keyboard button click handler
function keyClickHandle(event) {
	var key = event.currentTarget.value;
	currentField.inKey(key);
}
// Physical keyboard handler (some browsers don't handle keypress event for backspace keyCode=8)
function keyboardHandle(event) {
	var keyCode = event.keyCode;
	if (keyCode == 0) {
		keyCode = event.which;
	}
	var key = String.fromCharCode(keyCode);
	var enabledKeys = "1234567890/*-+<>=.";
	if (enabledKeys.indexOf(key) < 0) {
		key = undefined;
		if (keyCode == 8) {
			key = "B";
		} //backspace = B
		if (keyCode == 13) {
			key = "E";
		} //enter = E
		if (keyCode == 44) {
			key = ".";
		} //comma = dot
	}
	if (key !== undefined) currentField.inKey(key);
	event.preventDefault();
	return false; //disable default
}
//
function catchBackspace(e) {
	if (e.keyCode === 8) { 
		currentField.inKey("B");
		e.preventDefault();
		return false;
	}
	return true;
} 
/*
 * Click map areas procedures
 */
function clickBlackboard() {
	document.getElementById("divKeyboard").style.visibility = "visible";
	document.getElementById("divTask").style.visibility = "visible";
	document.getElementById("divSettings").style.visibility = "hidden";
	document.getElementById("divHelp").style.visibility = "hidden";
	document.getElementById("divAbout").style.visibility = "hidden";
	currentTask.generate();
	currentTask.show();
}
//
function clickTeacher() {
	document.getElementById("divKeyboard").style.visibility = "visible";
	document.getElementById("divTask").style.visibility = "hidden";
	document.getElementById("divHelp").style.visibility = "hidden";
	document.getElementById("divAbout").style.visibility = "hidden";
	settings.restore();
	var settingsEl = document.getElementById("divSettings");
	if (settingsEl.style.visibility == "visible") {
		settingsEl.style.visibility = "hidden";
		currentField.reset();
	} else {
		settingsEl.style.visibility = "visible";
		currentField.set(document.getElementById("minOpd2nd"), 1 // 2nd operand from 1 to 9
			, "1234567890", function() {
				settings.update2ndValues();
				if (currentField.element === document.getElementById("minOpd2nd")) {
					currentField.setElement(document.getElementById("maxOpd2nd"));
				} else {
					currentField.setElement(document.getElementById("minOpd2nd"));
				}
			}
		);
	};
}
//
function clickMisha() {
	document.getElementById("divTask").style.visibility = "visible";
	document.getElementById("divSettings").style.visibility = "hidden";
	document.getElementById("divHelp").style.visibility = "hidden";
	document.getElementById("divAbout").style.visibility = "hidden";
	daybook.showPrevTask();
}
//
function clickPupils() {
	document.getElementById("divKeyboard").style.visibility = "hidden";
	document.getElementById("divTask").style.visibility = "hidden";
	document.getElementById("divSettings").style.visibility = "hidden";
	document.getElementById("divHelp").style.visibility = "visible";
	document.getElementById("divAbout").style.visibility = "hidden";
}
//
function decodeHTML(str) {
	if (str.toUpperCase() == "&GT;") {
		return ">";
	}
	if (str.toUpperCase() == "&LT;") {
		return "<";
	}
	return str;
}
// Round number to tenths
//http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript
function roundToTenths(num) {
	return +(Math.round(num + "e+1") + "e-1");
}
/*
 * Generate task examples
 */
function generateTask() {
	function genAdd(opds) {
		var exArr = opds.split(" ");
		return exArr[0] + " + " + exArr[2] + " = " + (Number(exArr[0]) + Number(exArr[2]));
	}

	function genSub(opds) {
		var exArr = genAdd(opds).split(" ");
		return exArr[4] + " - " + exArr[2] + " = " + exArr[0];
	}

	function genMul(opds) {
		var exArr = opds.split(" ");
		return exArr[0] + " * " + exArr[2] + " = " + (exArr[0] * exArr[2]);
	}

	function genDiv(opds) {
		var exArr = genMul(opds).split(" ");
		return exArr[4] + " / " + exArr[2] + " = " + exArr[0];
	}
	//
	function generateExample() {
		//http://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
		function randInt(minInt, maxInt) {
			if (minInt == maxInt) return minInt;
			return Math.floor((Math.random() * (maxInt - minInt + 1)) + minInt);
		}
		// generate operands
		var opd1 = randInt(1, 9);
		var opd2 = randInt(settings.min2nd, settings.max2nd);
		// select operation index
		var opIdx = selectedArr[0][randInt(0, selectedArr[0].length - 1)];
		// select find to index
		var findTo = selectedArr[2][randInt(0, selectedArr[2].length - 1)];
		// apply order of magnitude
		var orderVal = selectedArr[1][randInt(0, selectedArr[1].length - 1)];
		if (orderVal > 1) {
			opd1 = opd1 * orderVal;
		} else {
			opd2 = opd2 * orderVal;
			if (opIdx < 2) opd1 = opd1 * orderVal; //addition, subtraction
		};
		// swap operands?
		var tmp = opd2;
		if (randInt(0, 1) == 1) {
			opd2 = opd1;
			opd1 = tmp;
		}
		// avoid ambiguity: 2 ? 2 = 4, x ? 1 = x
		// find to arithmetic operation
		if (findTo == 1 && (opd1 == 1 || opd2 == 1 || opd2 == 2)) { 
			opd1 = randInt(3, 9);
			opd2 = randInt(3, 9);
		}
		// apply arithmetic operation
		var exArr = operations[opIdx](opd1 + "  " + opd2).split(" ");
		// find to = relation?
		if (findTo == 3) {
			tmp = Number(exArr[4]); //keep result
			exArr[4] = (new Array(Math.abs(tmp - opd2), tmp, tmp + opd2))[randInt(0, 2)]; //new result
			if (tmp > exArr[4]) exArr[3] = ">";
			if (tmp < exArr[4]) exArr[3] = "<";
		}
		exArr[0] = roundToTenths(exArr[0]);
		exArr[2] = roundToTenths(exArr[2]);
		exArr[4] = roundToTenths(exArr[4]);
		var rightAnswer = exArr[findTo];
		exArr[findTo] = "?";
		return exArr[0] + " " + exArr[1] + " " + exArr[2] + " " + exArr[3] + " " + exArr[4] + " " + rightAnswer + " " + findTo;
	}
// convert settings bitmap
	function maskToArr(opIdxArr, orderArr, findIdxArr) {
		var optBits = settings.bitmask;
		var selectedOps = new Array();
		for (var i = 0; i < opIdxArr.length; i++) {
			if (optBits & 1) selectedOps.push(opIdxArr[i]);
			optBits /= 2;
		}
		var selectedOrders = new Array();
		for (var i = 0; i < orderArr.length; i++) {
			if (optBits & 1) selectedOrders.push(orderArr[i]);
			optBits /= 2;
		}
		var selectedFinds = new Array();
		for (var i = 0; i < findIdxArr.length; i++) {
			if (optBits & 1) selectedFinds.push(findIdxArr[i]);
			optBits /= 2;
		}
		return new Array(selectedOps, selectedOrders, selectedFinds);
	}
	var operations = [genAdd, genSub, genMul, genDiv];
	var selectedArr = maskToArr([0, 1, 2, 3] //selected arithmetic operation index
		, [1, 10, 0.1] //selected order of magnitude
		, [0, 4, 2, 1, 3]); //selected what find to index: 0,2 - operand; 1-operation; 3-relation; 4-result
	var examplesArr = new Array();
	for (var i = 0; i < 10; i++) examplesArr.push(generateExample());
	return examplesArr;
}
//
function playAnimation() {

}
/*
 * Save / Restore data (settings, task, daybook)
 */
function resetData(name) {
	deleteCookie(name);
}
//
function restoreData(name) {
	return getCookie(name);
}
//
function saveData(name, value) {
	deleteCookie(name);
	//keep cookie two weeks
	//   setCookie(name, value, {expires: new Date(new Date().getDate() + 14)});
	setCookie(name, value, {
		expires: 1209600
	});
};
// (c) Ilya Kantor, cookie.js, https://learn.javascript.ru/cookie
// возвращает cookie с именем name, если есть, если нет, то undefined
function getCookie(name) {
	var matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
// устанавливает cookie с именем name и значением value
// options - объект с свойствами cookie (expires, path, domain, secure)
function setCookie(name, value, options) {
	options = options || {};

	var expires = options.expires;

	if (typeof expires == "number" && expires) {
		var d = new Date();
		d.setTime(d.getTime() + expires * 1000);
		expires = options.expires = d;
	}
	if (expires && expires.toUTCString) {
		options.expires = expires.toUTCString();
	}

	value = encodeURIComponent(value);

	var updatedCookie = name + "=" + value;

	for (var propName in options) {
		updatedCookie += "; " + propName;
		var propValue = options[propName];
		if (propValue !== true) {
			updatedCookie += "=" + propValue;
		}
	}

	document.cookie = updatedCookie;
}

// удаляет cookie с именем name
function deleteCookie(name) {
	setCookie(name, "", {
		expires: -1
	})
}


