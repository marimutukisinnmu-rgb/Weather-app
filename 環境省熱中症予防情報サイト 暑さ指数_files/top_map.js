var ver_num = new Date().getTime();
var num = 0;
var map_home = '/img/'
var time_array = new Array("03","06","09","12","15","18","21","24");
var dir_array = new Array("map_td","map_tm","map_da");
var img_usemap = new Array("#map_td","#map_tm","#map_da");
var map_now = map_home + "map_td/" + map_name;
var img_src = new Array(map_now);

for (var i = 0, len1 = dir_array.length; i < len1; ++i) {
    if (dir_array[i] == "map_td") {
        for (var j = 0, len2 = time_array.length; j < len2; ++j) {
            if (Number(time_array[j]) > nw_time) {
                map_file = map_home + dir_array[i] + "/" + time_array[j] + "/" + map_name;
                img_src.push(map_file);
            }
        }
    } else {
        for (var j = 0, len2 = time_array.length; j < len2; ++j) {
            map_file = map_home + dir_array[i] + "/" + time_array[j] + "/" + map_name;
            img_src.push(map_file);
        }
    }
}


//初期表示
function page_open(region, prefecture){
    var url_hash = parent.location.hash;
    var hash_num = url_hash.replace("#", "");

    if (hash_num > 0 && hash_num < img_src.length) {
        num = hash_num;
        var date_flg = img_src[num].substr(9, 2);
        if (date_flg == "td") {
            var forecast_time = img_src[num].substr(12, 2).replace("0", "");
            document.getElementById("top_daytime").innerText=td_date + forecast_time + "時の予測";
            document.getElementById("top_map").useMap = img_usemap[0];
            document.getElementById("button1").disabled="";
        } else if (date_flg == "tm") {
            var forecast_time = img_src[num].substr(12, 2).replace("0", "");
            document.getElementById("top_daytime").innerText=tm_date + forecast_time + "時の予測";
            document.getElementById("top_map").useMap = img_usemap[1];
            document.getElementById("button1").disabled="";
        } else if (date_flg == "da") {
            var forecast_time = img_src[num].substr(12, 2).replace("0", "");
            document.getElementById("top_daytime").innerText=da_date + forecast_time + "時の予測";
            document.getElementById("top_map").useMap = img_usemap[2];
            document.getElementById("button1").disabled="";
        }
        if ( hash_num == img_src.length - 1) {
            document.getElementById("button2").disabled="disabled";
        }
    } else {
        document.getElementById("top_daytime").innerText=td_date + nw_time + "時現在";
        document.getElementById("top_map").useMap = img_usemap[0];
    }
    document.getElementById("top_map").src=img_src[num] + "?date=" + ver_num;
    if (!prefecture) {
        setTooltip(region);
    }
}


//画像切替
//進む
function go_forward(region, prefecture){
    num ++;
    document.getElementById("top_map").src=img_src[num] + "?date=" + ver_num;
    parent.location.hash = num;
    var forecast_time = img_src[num].substr(12, 2).replace("0", "");
    if (num == (img_src.length - 1)) {
        document.getElementById("top_daytime").innerText=da_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[2];
        document.getElementById("button2").disabled="disabled";
    } else if (num < img_src.length - 16) {
        document.getElementById("top_daytime").innerText=td_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[0];
    } else if (num >= img_src.length - 16 && num < img_src.length - 8) {
        document.getElementById("top_daytime").innerText=tm_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[1];
    } else if (num >= img_src.length - 8) {
        document.getElementById("top_daytime").innerText=da_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[2];
    }
    document.getElementById("button1").disabled="";
    if (!prefecture) {
        setTooltip(region);
    }
}

//戻る
function go_back(region, prefecture){
    num --;
    document.getElementById("top_map").src=img_src[num] + "?date=" + ver_num;
    parent.location.hash = num;
    var forecast_time = img_src[num].substr(12, 2).replace("0", "");
    if (num == 0) {
        document.getElementById("top_daytime").innerText=td_date + nw_time + "時現在";
        document.getElementById("top_map").useMap = img_usemap[0];
        document.getElementById("button1").disabled="disabled";
    } else if (num > img_src.length - 9) {
        document.getElementById("top_daytime").innerText=da_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[2];
    } else if (num <= img_src.length - 9 && num > img_src.length - 17) {
        document.getElementById("top_daytime").innerText=tm_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[1];
    } else if (num <= img_src.length - 17) {
        document.getElementById("top_daytime").innerText=td_date + forecast_time + "時の予測";
        document.getElementById("top_map").useMap = img_usemap[0];
    }
    document.getElementById("button2").disabled="";
    if (!prefecture) {
        setTooltip(region);
    }
}


//ツールチップ
function setTooltip(region){
    var url_hash = parent.location.hash;
    var hash_num = url_hash.replace("#", "");
    var targetId = "";

    if (hash_num > 0 && hash_num < img_src.length) {
        num = hash_num;
        var date_flg = img_src[num].substr(9, 2);
        var time_flg = img_src[num].substr(12, 2);
        if (date_flg == "td") {
            targetId = "divTd";
        } else if (date_flg == "tm") {
            targetId = "divTm";
        } else if (date_flg == "da") {
            targetId = "divDa";
        }
        var tooltip_name = "top_tooltip_" + date_flg + "_" + time_flg;
    } else {
        targetId = "divTd";
        var tooltip_name = "top_tooltip_td";
    }

    $.getScript("js/" + tooltip_name + ".js");

    $("#" + targetId).mousemove(function(e){
        var pointList = [];
        var tooltip = eval(tooltip_name);
        pointList = tooltip[region];
        if (pointList) {
            var off = $(this).offset();
            var offsetX = e.pageX - off.left;
            var offsetY = e.pageY - off.top;
            var flag = false;
            for (var i = 0; i < pointList.length; i++) {
                var point = pointList[i];
                var leftTopX = point[2];
                var leftTopY = point[3];
                var rightBottomX = point[4];
                var rightBottomY = point[5];
                if (offsetX >= leftTopX && offsetX <= rightBottomX &&
                    offsetY >= leftTopY && offsetY <= rightBottomY) {
                    spanMouseOverEvent(new Array(targetId, e.pageX, e.pageY, point[0], point[1]));
                    flag = true;
                    break;
                }
            }
            if (flag == false) {
                spanMouseLeaveEvent();
            }
        }
    });

    $("#" + targetId).mouseout(function(){
        spanMouseLeaveEvent();
    });
}
