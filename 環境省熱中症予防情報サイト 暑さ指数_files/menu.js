$(function() {
    //li要素にマウスホバーでスライドダウン/アップのイベント発火
    $("ul.main-menu li").hover(function() {
        $(">ul:not(:animated)", this).slideDown(0);
    }, function() {
        $(">ul", this).slideUp(0);
    });
});
