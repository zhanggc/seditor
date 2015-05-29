/**
 * Author: zhanggc
 * Date: 2015/3/30.
 * Todo: 放大器插件
 */

SEDITOR.plugins.add('zoom', {


    //状态切换
    //true 放大
    //false 缩小
    custom: {
        state: false
    },

    //工具栏
    toolbar: {

        //是否必须
        required: true,

        title: '放大器',
        events: {
            click: function ( widget) {
                var $container = widget.seditor.$dest.find('.sed_container');
                var $contents = widget.seditor.$dest.find('.sed_contents');
                var top_heigt,bottom_heigt, padding;
                if (widget.seditor.getModel() === 'inline') {
                    bottom_heigt = 0;
                    top_heigt = 0;
                    padding = 0;
                }else{
                    bottom_heigt = $('.sed_bottom').height();
                    top_heigt = $('.sed_top').height();
                    padding = 18;
                }
                if (widget.custom.state) {
                    $container.parents().each(function () {
                        var $this = $(this);
                        if ($this.data('zoom_style')) {
                            $this.attr('style', $this.data('zoom_style'));
                        } else {
                            $this.removeAttr('style');
                        }
                        $this.hide();   //消除隐藏
                    });
                    $container.parents().each(function () {
                        var $this = $(this);
                        $this.show();   ////消除隐藏
                        if ($this.data('zoom_style')) {
                            $this.attr('style', $this.data('zoom_style'));
                        } else {
                            $this.removeAttr('style');
                        }
                    });

                    $container.removeClass('widget_zoom_container').css('width', 'auto');
                    $contents.height(widget.seditor.config.content.height);
                    $(window).unbind('resize');

                    widget.custom.state = false;

                    widget.toolbar.$.removeClass('sed_button_on');
                } else {
                    $container.parents().each(function () {
                        var $this = $(this);
                        $this.data('zoom_style', $this.attr('style'));
                        $this.removeAttr('style');
                    });
                    $container.addClass('widget_zoom_container').width($(window).width()).parents().attr('style', 'position: static; z-index: 888; width: 0px; height: 0px;');
                    $('html').attr('style', "position: fixed; z-index: 888; width: 0px; height: 0px; margin: 0px; padding: 0px;");
                    $contents.height(($(window).height() - top_heigt - bottom_heigt - padding));
                    $(window).resize(function () {
                        $container.width($(window).width());
                        $contents.height(($(window).height() - top_heigt - bottom_heigt - padding));
                    });

                    widget.custom.state = true;

                    widget.toolbar.$.addClass('sed_button_on');
                }
            }
        }
    }
});

