/**
 * Author: zhanggc
 * Date: 2015/3/30.
 * Todo 预览插件
 */


SEDITOR.plugins.add('preview', {

    name: '预览',

    custom: {
        //组成页面
        page: function (js, css, content) {
            var html = '<html><head>' + js + css + '</head><body>' + content + '</body></html>';
            return html;
        }
    },

    //工具栏
    toolbar: {

        //是否必须
        required: true,

        title: '预览',

        events: {
            click: function ( widget) {
                    //打开路径
                    var css = js = content = '', sOpenUrl = this.basePath + 'preview.html';

                    $(widget.seditor.getConfig().content.scripts).each(function () {
                        js += '<script type="text/javascript" src="' + this + '"></script>'
                    });

                    $(widget.seditor.getConfig().content.styleSheets).each(function () {
                        css += '<link href="' + this + '" rel="stylesheet" type="text/css">';
                    });

                    content = widget.seditor.getData();

                    window._cke_htmlToLoad = widget.custom.page(js, css, content);

                    var oWindow = window.open(sOpenUrl, null, 'toolbar=yes,location=no,status=yes,menubar=yes,scrollbars=yes,resizable=yes');

                    var doc = oWindow.document;

                    doc.open();
                    doc.write(_cke_htmlToLoad);
                    doc.close();
            }
        }
    }

});
