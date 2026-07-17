
/*******************************************************
 * 選択リスト初期化関数
 * 引数: ( 初期表示地方 )
 *******************************************************/
function initSelection( val1, val2, val3 ) {
    var regionObj = document.getElementById("region");
    var prefectureObj = document.getElementById("prefecture");
    var pointObj = document.getElementById("point");

    var key = null;

    // 地方設定
    createSelection(regionObj, "地方", region);
    if (val1) {
        for (var i = 0; i < regionObj.length; i++) {
            if (regionObj.options[i].value == val1) {
                regionObj.selectedIndex = i;
                break;
            }
        }
    } else {
        regionObj.selectedIndex = 0;
    }

    // 都府県・振興局設定
    if (regionObj.selectedIndex > 0) {
        key = regionObj.options[regionObj.selectedIndex].value;
        if (regionObj.selectedIndex == 1) {
            createSelection(prefectureObj, "振興局", prefecture[key]);
        } else {
            createSelection(prefectureObj, "都府県", prefecture[key]);
        }
        if (val2) {
            for (var i = 0; i < prefectureObj.length; i++) {
                if (prefectureObj.options[i].value == val2) {
                    prefectureObj.selectedIndex = i;
                    break;
                }
            }
        } else {
            prefectureObj.selectedIndex = 0;
        }
    } else {
        createSelection(prefectureObj, "都府県", []);
    }

    // 地点設定
    if (regionObj.selectedIndex > 0) {
        if (prefectureObj.selectedIndex > 0) {
            key = prefectureObj.options[prefectureObj.selectedIndex].value;
            createSelection(pointObj, "地点", point[key]);
            if (val3) {
                for (var i = 0; i < pointObj.length; i++) {
                    if (pointObj.options[i].value == val3) {
                        pointObj.selectedIndex = i;
                        break;
                    }
                }
            } else {
                pointObj.selectedIndex = 0;
            }
        } else {
            createSelection(pointObj, "地点", []);
        }
    } else {
        createSelection(pointObj, "地点", []);
    }
    
    // 地点名設定
    var prefectureName = prefectureObj.options[prefectureObj.selectedIndex].text;
    var pointeName = pointObj.options[pointObj.selectedIndex].text;
    if (document.getElementById("pointName")) {
        document.getElementById("pointName").innerHTML = pointeName + "（" + prefectureName + "）";
        document.title = document.title + " " + pointeName + "（" + prefectureName + "）";
    }
    if (document.getElementById("pointName1w")) {
        document.getElementById("pointName1w").innerHTML = pointeName;
        document.title = document.title + " " + pointeName + "（" + prefectureName + "）";
    }
    if (document.getElementById("pointName_sp")) {
    	document.getElementById("pointName_sp").innerHTML = pointeName + "(" + prefectureName + ")";
        document.title = document.title + " " + pointeName + "(" + prefectureName + ")";
    }
}

/*******************************************************
 * 選択リストを作る関数
 * 引数: ( selectオブジェクト, 見出し, 配列 )
 *******************************************************/
function createSelection( selObj, midashi, ary)
{
    selObj.length = 0;
    addSelOption(selObj, "", midashi);
    // 初期化
    for(var i = 0; i < ary.length; i++) {
        addSelOption(selObj, ary[i][0], ary[i][1]);
    }
}

/*******************************************************
 * 選択ボックスに選択肢を追加する関数
 * 引数: ( selectオブジェクト, value値, text値)
 *******************************************************/
function addSelOption( selObj, myValue, myText ) {
    selObj.length++;
    selObj.options[selObj.length - 1].value = myValue;
    selObj.options[selObj.length - 1].text  = myText;
}

/*******************************************************
 * 地方選択時に呼び出し関数
 * 引数: ( オブジェクト )
 *******************************************************/
function selectRegion( obj ) {
    if (document.getElementById("region").selectedIndex == 0) {
            createSelection(document.getElementById("prefecture"), "都府県", []);
    }
    else if (document.getElementById("region").selectedIndex == 1) {
        createSelection(document.getElementById("prefecture"), "振興局", prefecture[obj.value]);
    } else {
        createSelection(document.getElementById("prefecture"), "都府県", prefecture[obj.value]);
    }
    createSelection(document.getElementById("point"), "地点", []);
}

/*******************************************************
 * 都道府県選択時に呼び出し関数
 * 引数: ( オブジェクト )
 *******************************************************/
function selectPrefecture( obj ) {
    createSelection(document.getElementById("point"), "地点", point[obj.value]);
}

/*******************************************************
 * 選択リスト初期化関数(暑さ指数ランキング)
 * 引数: ( オブジェクト )
 *******************************************************/
function initRankSelect(val1, val2, val3, tmp_day, val6, tmp_dayList, sysTime) {
	var areaVal = ["0000","0001"];
	var areaTxt = ["全国","全国（南西諸島を除く）"];
	var noVal = ["10","20","30","50","100"];
	var noTxt = ["10","20","30","50","100"];
	var monthVal = new Array();
	var monthTxt = new Array();
	var dayVal = new Array();
	var dayTxt = new Array();
	var timeVal = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24"];
	var timeTxt = ["1:00","2:00","3:00","4:00","5:00","6:00","7:00","8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00","24:00"];
	var areaObj = document.getElementById("area");
	var prefectureObj = document.getElementById("prefecture");
	var noObj = document.getElementById("no");
	var monthObj = document.getElementById("month");
	var dayObj = document.getElementById("day");
	var orgDayObj = document.getElementById("org_day");
	var timeObj = document.getElementById("time");
	var dayList = tmp_dayList.split(",");
	var val4 = tmp_day.substring(0,6);
	var val5 = tmp_day.substring(0,8);
	
	//月日
	monthObj.length = 0;
	dayObj.length = 0;
	timeObj.length = 0;
	for (var i = (dayList.length - 1); i >= 0; i--) {
		var isNew = true;
        for (var j = 0; j < monthVal.length; j++) {
            if (monthVal[j] == dayList[i].substring(0,6)) {
                isNew = false;
                break;
            }
        }
		if(isNew){
			monthVal.push(dayList[i].substring(0,6));
			monthTxt.push(dayList[i].substring(4,6));
		}
		
		dayVal.push(dayList[i].substring(0,8));
		dayTxt.push(dayList[i].substring(6,8));
	}
	//月
	for (var i = 0; i < monthVal.length; i++) {
		addSelOption(monthObj, monthVal[i], monthTxt[i]);
	}
	if (val4) {
    	for (var i = 0; i < monthObj.length; i++) {
            if (monthObj.options[i].value == val4) {
                monthObj.selectedIndex = i;
                break;
            }
        }
    } else {
		monthObj.selectedIndex = monthObj.length - 1;
	}
	//日
	for (var i = 0; i < dayVal.length; i++) {
		addSelOption(dayObj, dayVal[i], dayTxt[i]);
		addSelOption(orgDayObj, dayVal[i], dayTxt[i]);
	}
	setObjHidden(dayObj,monthVal[monthObj.selectedIndex],orgDayObj);
	if (val5) {
    	for (var i = 0; i < dayObj.length; i++) {
            if (dayObj.options[i].value == val5) {
                dayObj.selectedIndex = i;
                break;
            }
        }
    } else {
        dayObj.selectedIndex = dayObj.length - 1;
    }
	//時
	for (var i = 0; i < timeVal.length; i++) {
		addSelOption(timeObj, timeVal[i], timeTxt[i]);
	}
	if (val6) {
    	for (var i = 0; i < timeObj.length; i++) {
            if (timeObj.options[i].value == val6) {
                timeObj.selectedIndex = i;
                break;
            }
        }
    } else {
		//timeObj.selectedIndex = 0;
		for (var i = 0; i < timeObj.length; i++) {
			if (timeObj.options[i].value == sysTime) {
                timeObj.selectedIndex = i;
                break;
            }
		}
	}
	
	
	//地方設定
	areaObj.length = 0;
    // 初期化
    for(var i = 0; i < region.length; i++) {
    	areaVal.push(region[i][0]);
    	areaTxt.push(region[i][1]);
    }
    for(var i = 0; i < areaVal.length; i++) {
        addSelOption(areaObj, areaVal[i], areaTxt[i]);
    }
    if (val1) {
    	for (var i = 0; i < areaObj.length; i++) {
            if (areaObj.options[i].value == val1) {
                areaObj.selectedIndex = i;
                break;
            }
        }
    } else {
		areaObj.selectedIndex = 0;
	}
	
    // 都府県・振興局設定
    if (areaObj.selectedIndex > 1) {
        key = areaObj.options[areaObj.selectedIndex].value;
        if (areaObj.selectedIndex == 2) {
            createSelection(prefectureObj, "振興局", prefecture[key]);
        } else {
            createSelection(prefectureObj, "都府県", prefecture[key]);
        }
        if (val2) {
            for (var i = 0; i < prefectureObj.length; i++) {
                if (prefectureObj.options[i].value == val2) {
                    prefectureObj.selectedIndex = i;
                    break;
                }
            }
        } else {
            prefectureObj.selectedIndex = 0;
        }
    } else {
        createSelection(prefectureObj, "都府県", []);
    }
	
	//件数設定
	noObj.length = 0;
    // 初期化
    for(var i = 0; i < noVal.length; i++) {
        addSelOption(noObj, noVal[i], noTxt[i]);
    }
    if (val3) {
        for (var i = 0; i < noObj.length; i++) {
            if (noObj.options[i].value == val3) {
                noObj.selectedIndex = i;
                break;
            }
        }
    } else {
        noObj.selectedIndex = 0;
    }
}

/*******************************************************
 * 月選択時に呼び出し関数(熱中症ランキング)
 * 引数: ( オブジェクト )
 *******************************************************/
function selectArea( obj ) {
	if (document.getElementById("area").selectedIndex < 2) {
        createSelection(document.getElementById("prefecture"), "都府県", []);
    }
    else if (document.getElementById("area").selectedIndex == 2) {
        createSelection(document.getElementById("prefecture"), "振興局", prefecture[obj.value]);
    } else {
        createSelection(document.getElementById("prefecture"), "都府県", prefecture[obj.value]);
    }
	submitRanking();
}

/*******************************************************
 * 月選択時に呼び出し関数(熱中症ランキング)
 * 引数: ( オブジェクト )
 *******************************************************/
function selectMonth( obj ) {
	setObjHidden(document.getElementById("day"),document.getElementById("month").value,document.getElementById("org_day"));
	submitRanking();
}

/*******************************************************
 * 月選択時に呼び出し関数(熱中症ランキング)
 * 引数: ( オブジェクト )
 *******************************************************/
function setObjHidden( obj, key, org_obj ) {
    var org_options = org_obj.options;

	obj.length = 0;
	for (var i = 0; i < org_options.length; i++) {
		if(org_options[i].value.substring(0,6) === key){
			addSelOption(obj, org_options[i].value, org_options[i].text);
		}
	}
	obj.selectedIndex = 0;
}
