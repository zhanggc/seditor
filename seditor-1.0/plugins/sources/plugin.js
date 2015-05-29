/**
 * Created by zhanggc on 2015/3/29.
 * Todo: 源码与视图切换插件
 */


SEDITOR.plugins.add('sources', {

    name: '视图',
    custom: {
        //状态切换
        //true 视图
        //false 源码
        state: true,

        textarea: '<textarea style="width:100%;height:100%;"></textarea>',
        //释放
        release: function (widget) {
            widget.exclusiveState = false;
            widget.onClass(false);
        }
    },

    //复写超类
    release: function () {
        //Nothing to do !
    },


    //工具栏
    toolbar: {

        //是否必须
        required: true,

        title: '源码',

        events: {
            click: function ( widget) {
                var $textarea,
                    data;
                if (widget.custom.state) {
                    //创建文本框
                    $textarea = $(widget.custom.textarea)
                    data = widget.seditor.getData();

                    if (typeof data === 'undefined') {
                        var handlerId = setInterval(function () {
                            data = widget.seditor.getData();
                            if (typeof data !== 'undefined') {
                                //获取数据
                                $textarea.val(data);

                                widget.seditor.$dest.find('.sed_contents').append($textarea);

                                //移除iframe
                                widget.seditor.layout.iframe.remove(widget.seditor);

                                //源码
                                widget.custom.state = false;
                                widget.$toolbar.find('.sed_button_name').text('源码');

                                //释放
                                widget.custom.release(widget);

                                clearInterval(handlerId);
                            }
                        }, 100);
                    } else {
                        //获取数据
                        $textarea.val(data);

                        //移除iframe
                        widget.seditor.layout.iframe.remove(widget.seditor);

                        widget.seditor.$dest.find('.sed_contents').append($textarea);

                        //源码
                        widget.custom.state = false;

                        widget.toolbar.$.addClass('sed_button_on');
                        widget.toolbar.$.find('.sed_button_name').text('源码');

                        //释放
                        widget.custom.release(widget);
                    }
                } else {
                    $textarea = widget.seditor.$dest.find('.sed_contents textarea');
                    //创建iframe
                    widget.seditor.layout.iframe.create(widget.seditor, widget);
                    widget.seditor.getConfig().content.data = $textarea.val();
                    widget.seditor.setData();
                    $textarea.remove();

                    var handlerId = setInterval(function () {
                        if (widget.seditor.element != null && widget.seditor.element.readyState) {

                            //视图
                            widget.custom.state = true;

                            widget.toolbar.$.removeClass('sed_button_on');

                            widget.toolbar.$.find('.sed_button_name').text('视图');

                            //释放
                            widget.custom.release(widget);

                            clearInterval(handlerId);
                        }
                    }, 100);
                }
            }
        }
    }

});