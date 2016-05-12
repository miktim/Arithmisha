/*
Arithmisha
(c) miktim@mail.ru
	2016 released as WEB App
	2002 idea, characters, Windows App
*/	
	var settings =
		{ bitmask:3+16+256 // operations:addition & subtraction; order of magnitude: ones; find: result 
		, min2nd:1	// 2nd operand from
		, max2nd:9 	// 2nd operand to
		, save: function() {
				replaceCookie("Settings",this.bitmask + "$" + this.min2nd + "$" + this.max2nd); 
			}
		, restore: function() {
				var settingsStr = getCookie("Settings");
				if (settingsStr === undefined) settingsStr = (3+16+256).toString() + "$1$9";
				var settingsArr = settingsStr.split("$");
				this.bitmask = Number(settingsArr[0]);
// for each checkbox class assign 
				var checkClassNames = ["setOp","setOrder","setFind"];
				for (var j=0; j < checkClassNames.length; j++) {
					var checkGrp = document.getElementsByClassName(checkClassNames[j]);
					for (var i=0; i < checkGrp.length; i++) {
// assign state (checked/unchecked) from settings
						if (this.bitmask & checkGrp[i].value) {checkGrp[i].checked=true;}
						else {checkGrp[i].checked=false;};
					}
				}
				this.setMin2nd(Number(settingsArr[1]));
				this.setMax2nd(Number(settingsArr[2])); 
			}
		, setMin2nd: function(num) {
				this.min2nd = num;
				document.getElementById("minOpd2nd").innerHTML = num;
			}
		, setMax2nd: function(num) {
				this.max2nd = num;
				document.getElementById("maxOpd2nd").innerHTML = num; 
			}			
		, update2ndValues: function() {
				var min2nd = Number(document.getElementById("minOpd2nd").innerHTML); 
				var max2nd = Number(document.getElementById("maxOpd2nd").innerHTML);
				if (min2nd == 0) min2nd = 1; 
				if (max2nd == 0) max2nd = 9;
				if (min2nd > max2nd) max2nd = min2nd;
				this.setMin2nd(min2nd);
				this.setMax2nd(max2nd);	
				this.save();
			}
		}
	
	var currentTask =
		{ date: null
		, timeSec:  0
		, examples: new Array()
		};
	var taskStarted = 0;
	var dayBook
		{ tasks: new Array() } ;
	var inValue =
		{ element: undefined
		, maxLen: 0
		, chars: ""
		, onchange: function() {}
		};
// estimate results		
	var eExcellent="Excellent, Misha!";
	var eGood="Good work, Misha.";
	var eSatisfy="Try again, Misha.";
	var eBad="????";

function postLoadInit() {
	document.getElementById("aboutApp").innerHTML = document.title;
	document.getElementById("keyMul").value = document.getElementById("keyMul").innerHTML;
	document.getElementById("keyDiv").value = document.getElementById("keyDiv").innerHTML;
	document.getElementById("areaTeacher").onclick =
	function() {
		document.getElementById("divKeyboard").style.visibility = "visible";
		document.getElementById("divTask").style.visibility = "hidden";
		document.getElementById("divHelp").style.visibility = "hidden";
		document.getElementById("divAbout").style.visibility = "hidden";
		settings.restore();
		var settingsEl = document.getElementById("divSettings");
		if (settingsEl.style.visibility == "visible") {
			settingsEl.style.visibility = "hidden";
		} else { 
			settingsEl.style.visibility = "visible";
		};
		return false; //disable default action
	};
	
	document.getElementById("areaMisha").onclick =
	function() {
		document.getElementById("divKeyboard").style.visibility = "hidden";
		document.getElementById("divTask").style.visibility = "visible";
		document.getElementById("divSettings").style.visibility = "hidden";
		document.getElementById("divHelp").style.visibility = "hidden";
		document.getElementById("divAbout").style.visibility = "hidden";
		return false; //disable default action
	};
	
	document.getElementById("areaBlackboard").onclick =
	function() {
		showTask();
		return false; //disable default action
	};
	document.getElementById("areaMap").onclick =
	function() {
//		document.getElementById("divKeyboard").style.visibility = "hidden";
//		document.getElementById("divTask").style.visibility = "hidden";
//		document.getElementById("divSettings").style.visibility = "hidden";
		document.getElementById("divAbout").style.visibility = "visible";
		return false; //disable default action
	};
	document.getElementById("areaPupils").onclick =
	function() {
		document.getElementById("divKeyboard").style.visibility = "hidden";
		document.getElementById("divTask").style.visibility = "hidden";
		document.getElementById("divSettings").style.visibility = "hidden";
		document.getElementById("divHelp").style.visibility = "visible";
		document.getElementById("divAbout").style.visibility = "hidden";
		return false; //disable default action
	};
	settings.restore();
// for each checkbox class in settings scene assign onclick handler
	var checkClassNames = ["setOp","setOrder","setFind"];
	for (var j=0; j < checkClassNames.length; j++) {
		var checkGrp = document.getElementsByClassName(checkClassNames[j]);
		for (var i=0; i < checkGrp.length; i++) {
// assign onclick handler
			checkGrp[i].onclick = function(event) { return checkClickHandle(event); }
		} 
	}
// for keyboard assign onclick handler
	var keyClassNames = ["keyButton","keyButtonWide"];
	for (var j=0; j < keyClassNames.length; j++) {
		var keyGrp = document.getElementsByClassName(keyClassNames[j]);
		for (var i=0; i < keyGrp.length; i++) {
			keyGrp[i].onclick = function(event) {keyClickHandle(event);};
		}
	}
	var keypressReciever = document.getElementsByTagName("body")[0];// document.getElementById("divKeyboard");
	keypressReciever.onkeypress = function(event) {keyPressHandle(event);}
};
// CheckBoxes onclick handler
function checkClickHandle(event) {
	var el = event.currentTarget;
// target state already changed
	if (!el.checked) {
// prevent all checkboxes in group unchecked
	   var elClassGrp = document.getElementsByClassName(el.className);
	   var checkedCnt = 0;
		for (var i=0; i < elClassGrp.length; i++) { 
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
// virtual keyboard button click handler
function keyClickHandle(event) {
	if (inValue.element === undefined) return;
	var key = event.currentTarget.value;
	var inLen = inValue.element.innerHTML.length;
	if (key == "B" && inLen > 0) {
		inValue.element.innerHTML=inValue.element.innerHTML.substr(0, inLen-1);
		return null;
   }
   if (key == "E" && inLen > 0) {
   	inValue.onchange();
   	return null;
   }
   if (inLen >= inValue.maxLen) return;
   if (inValue.chars.search(key) < 0) return null;
   inValue.element.innerHTML += key;
	return null;
}

function keyPressHandle(event) {
  var key = event.keyCode;
  if (key == 8) { key = 66;} //backspace = B
  if (key == 13){ key = 69;} //enter = E
  var charVal = String.fromCharCode(key);      
  var enabledKeys = "1234567890/*-+<>=,.EB";
  if (enabledKeys.search(charVal) < 0) return false;
  alert(charVal);
  return false; // спец. символ
}
//
function showTask(){
		document.getElementById("divKeyboard").style.visibility = "visible";
		document.getElementById("divTask").style.visibility = "visible";
		document.getElementById("divSettings").style.visibility = "hidden";
		document.getElementById("divHelp").style.visibility = "hidden";
		document.getElementById("divAbout").style.visibility = "hidden";
		fillTask();
}
// Round number to tenths
//http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript		
function roundToTenths(num) {    
	return +(Math.round(num + "e+1")  + "e-1");
}
//
function generateTask() {
	function genAdd(opds) {
		var exArr = opds.split(" ");
		return exArr[0] + " + "	+ exArr[2] + " = " + (Number(exArr[0]) + Number(exArr[2]));
	}
	function genSub(opds) {
		var exArr = genAdd(opds).split(" ");
		return exArr[4] + " - " + exArr[2] + " = " + exArr[0];
	}
	function genMul(opds) {
		var exArr = opds.split(" ");
		return exArr[0] + " * "
			+ exArr[2] + " = " + (exArr[0]*exArr[2]);
	}
	function genDiv(opds) {
		var exArr = genMul(opds).split(" ");
		return exArr[4] + " / "
			+ exArr[2] + " = " + exArr[0];
	}
//
	function generateExample() {
//http://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
		function randInt(minInt, maxInt) {
			if (minInt==maxInt) return minInt;
			return Math.floor((Math.random() * (maxInt-minInt+1)) + minInt);
		}
		// generate operands
		var opd1 = randInt(1,9);
		var opd2 = randInt(settings.min2nd, settings.max2nd);
		// select operation index
		var opIdx = selectedArr[0][randInt(0,selectedArr[0].length-1)];
		// select find to index
		var findTo = selectedArr[2][randInt(0,selectedArr[2].length-1)];
		// avoid ambiguity: 2 ? 2 = 4, x ? 1 = 1
		if (findTo==1 && opd1==opd2) { //find to arithmetic operation
			if ((opd1==1 && (opIdx==2 || opIdx==3)) || (opd1==2 && (opIdx==0 || opIdx==2)))
				opd1 = randInt(3,9);
		}
		// apply order of magnitude
		var orderVal = selectedArr[1][randInt(0,selectedArr[1].length-1)];
		if (orderVal > 1) { opd1 = opd1*orderVal; }
		else { opd2 = opd2*orderVal; };
		// swap operands?
		var tmp = opd2;
		if (randInt(0,1)==1) {
			opd2 = opd1;
			opd1 = tmp;
		}
		// apply arithmetic operation
		var exArr = operations[opIdx](opd1+"  "+opd2).split(" ");
		// find to = relation?
		if (findTo == 3) {
			tmp = Number(exArr[4]); //keep result
			exArr[4] = (new Array(Math.abs(tmp-opd2),tmp,tmp+opd2))[randInt(0,2)]; //new result
			if (tmp > exArr[4]) exArr[3]=">";
			if (tmp < exArr[4]) exArr[3]="<";
		}
		exArr[0] = roundToTenths(exArr[0]);
		exArr[2] = roundToTenths(exArr[2]);
		exArr[4] = roundToTenths(exArr[4]);
		var rightAnswer = exArr[findTo];
		exArr[findTo] = "?";
		return exArr[0] + " " + exArr[1] + " " + exArr[2] + " " + exArr[3] + " " + exArr[4] + " " 
			+ rightAnswer + " "+ findTo ; 
	}
//
	function maskToArr(opIdxArr,orderArr,findIdxArr) {
		var optBits = settings.bitmask;
		var selectedOps = new Array();
		for (var i=0; i < opIdxArr.length; i++) {
			if (optBits & 1) selectedOps.push(opIdxArr[i]);
			optBits /= 2;
		}
		var selectedOrders = new Array();
		for (var i=0; i < orderArr.length; i++) {
			if (optBits & 1) selectedOrders.push(orderArr[i]);
			optBits /= 2;
		}
		var selectedFinds = new Array();
		for (var i=0; i < findIdxArr.length; i++) {
			if (optBits & 1) selectedFinds.push(findIdxArr[i]);
			optBits /= 2;
		}
		return new Array(selectedOps, selectedOrders, selectedFinds);
	}
	var operations = [genAdd, genSub, genMul, genDiv];
	var selectedArr = maskToArr([0,1,2,3]		//selected arithmetic operation index
										,[1,10,0.1]		//selected order of magnitude
										,[0,4,2,1,3]);	//selected what find to index: 0,2 - operand; 1-operation; 3-relation; 4-result
	var examplesArr = new Array();
	for (var i=0; i<10; i++) examplesArr.push(generateExample());
	return examplesArr;
}
//
function appendList(dest, src) {
  var n;
  for (n = 0; n < src.length; ++n) {
    dest.push(src[n]);
  }
  return dest;
}
//
function fillTask() {
	var taskLst = generateTask();
//
	var firstQuestion = true;
	for (var i=0; i < taskLst.length; i++) {
		var exArr = taskLst[i].split(" ");
		for (var j=0; j<5; j++){
			var tdId = "e"+String(i)+String(j);
			var tdEl = document.getElementById(tdId);
			tdEl.innerHTML = exArr[j];
			if (exArr[j] == "?") {
				if (firstQuestion) { 
					tdEl.className = "edited";
					firstQuestion = false;
				} else {
					tdEl.className="editable";
				}
			} else {
				tdEl.className="exNormal";
			}
		}
	}	
}
// https://learn.javascript.ru/cookie
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
//
function replaceCookie(name, value, options) {
	deleteCookie(name);
	setCookie(name,value,options);
};
