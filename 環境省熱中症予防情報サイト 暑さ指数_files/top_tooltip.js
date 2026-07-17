var tooltipId = "wbgtTooltip";

/*******************************************************
 * ツールチップ初期処理
 * 引数: ( ID )
 *******************************************************/
function initTooltipEvent(region, prefecture)
{
    if (!prefecture) {
        setTooltipEvent("divTd", region);
        setTooltipEvent("divTm", region);
        setTooltipEvent("divDa", region);
    }
}

/*******************************************************
 * ツールチップ作成
 * 引数: ( ID )
 *******************************************************/
function setTooltipEvent(targetId, region)
{
    $("#" + targetId).mousemove(function(e){
        var pointList = [];
        if (targetId == "divTd") {
            pointList = top_tooltip_td[region];
        } else if (targetId == "divTm") {
            pointList = top_tooltip_tm[region];
        } else if (targetId == "divDa") {
            pointList = top_tooltip_da[region];
        }
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

/*******************************************************
 * ツールチップ作成
 * 引数: ( パラメータ, X座標, Y座標 )
 *******************************************************/
function mouseOverEvent(param)
{
    $("#" + tooltipId).remove();  //一度表示したツールチップを消す。
    
    var color = getTooltipColor(param[4]);
    var moji = getTooltipMojiColor(param[4]);
//    var html = param[3] + "<br/>" + param[4] + "℃";
    var html = param[3] + "<br/>" + param[4];

    var x = param[1] + 10;
    var y = param[2] - 35;
    
    //ツールチップ作成
    var toolTip = $('<div />').attr("id", tooltipId)
                  .addClass("jqplot-highlighter-tooltip")
                  .css("position","absolute")
                  .css("left",x+"px")
                  .css("top",y+"px")
                  .css("background",color)
                  .css("color",moji)
                  .css("border-width","1px")
                  .css("border-style","solid")
                  .css("text-align","right")
                  .css("font-size","12px")
                  .css("font-weight","normal")
                  .css("padding","2px")
                  //.css("z-index","20")
                  .html(html);

    //要素に追加
    $("#" + param[0]).append(toolTip);
}

/*******************************************************
 * 暑さ指数ツールチップ作成関数
 * 引数: ( パラメータ )
 *******************************************************/
function spanMouseOverEvent(param)
{
    $("#" + tooltipId).remove();  //一度表示したツールチップを消す。
    mouseOverEvent(param);
}

/*******************************************************
 * 暑さ指数ツールチップ削除関数
 * 引数: ( )
 *******************************************************/
function spanMouseLeaveEvent()
{
    $("#" + tooltipId).remove();
}

/*******************************************************
 * 暑さ指数ツールチップカラー取得関数
 * 引数: ( )
 *******************************************************/
function getTooltipColor(wbgt)
{
    color = "#000000";
    if (wbgt) {
        if (wbgt == "---") {
            color = "#d1d1d1";
        } else {
/*-- 2019.02.25
            if (wbgt >= 31) {
                color = "#fd8977";
                //color = "#fb5439";
            } else if (wbgt >= 28 && wbgt < 31) {
                color = "#fbc65d";
                //color = "#faa210";
            } else if (wbgt >= 25 && wbgt < 28) {
                color = "#fee955";
                //color = "#fde308";
            } else if (wbgt >= 21 && wbgt < 25) {
                color = "#a6e888";
                //color = "#7eee72";
            } else {
                color = "#7ef2ff";
                //color = "#6de9ff";
            }
--*/
        if (wbgt >= 31) {
            color = "#ff2800";
        } else if (wbgt >= 28 && wbgt < 31) {
            color = "#ff9600";
        } else if (wbgt >= 25 && wbgt < 28) {
            color = "#faf500";
        } else if (wbgt >= 21 && wbgt < 25) {
            color = "#a0d2ff";
        } else {
            color = "#218cff";
        }
        }
    }
    return color;
}

/*******************************************************
 * 暑さ指数ツールチップ文字カラー取得関数
 * 引数: ( )
 *******************************************************/
function getTooltipMojiColor(wbgt)
{
    color = "#000000";
    if (wbgt) {
        if (wbgt == "---") {
            color = "#000000";
        } else {
        if (wbgt >= 31) {
            color = "#ffffff";
        } else if (wbgt >= 28 && wbgt < 31) {
            color = "#000000";
        } else if (wbgt >= 25 && wbgt < 28) {
            color = "#000000";
        } else if (wbgt >= 21 && wbgt < 25) {
            color = "#000000";
        } else {
            color = "#ffffff";
        }
        }
    }
    return color;
}

/*******************************************************
 * 印刷時のずれ修正
 * 引数: ( )
 *******************************************************/
(function($) {
    $.fn.CanvasHack = function() {
        var canvases = this.find('canvas').filter(function() {
            return $(this).css('position') == 'absolute';
        });

        canvases.wrap(function() {
            var canvas = $(this);
            var div = $('<div />').css({
                    position: 'absolute',
                    top: canvas.css('top'),
                    left: canvas.css('left')
            });
            canvas.css({
                    top: '0',
                    left: '0'
            });
            return div;
        });

        return this;
    };
})(jQuery);

