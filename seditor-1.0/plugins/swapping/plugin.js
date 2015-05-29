/**
 * Author: zhanggc
 * Date: 2015/3/31.
 * Todo: 位置对换插件
 */

SEDITOR.plugins.add('swapping', {

    custom: {
        //标识
        tags: ['link', 'suitPro'],
        startNode: {
            style: null,
            $: null,
            $copy: null,
            $copyWithEvents: null,
            clear: function () {
                this.$ = null;
                this.$copy = null;
                this.$copyWithEvents = null;
            }
        },
        stopNode: {
            style: null,
            $: null,
            $copy: null,
            $copyWithEvents: null,
            clear: function () {
                this.$ = null;
                this.$copy = null;
                this.$copyWithEvents = null;
            }
        },

        swapping: function ($elements, widget) {
            var $ = widget.seditor.$,
                $document = $(widget.seditor.document);

            $elements.mouseup(function (event) {
                var $this = $(this);

                $document.unbind('mousemove');
                $document.unbind('mouseup');

                if (widget.custom.startNode.$) {
                    if (widget.custom.startNode.$[0] !== this) {
                        widget.custom.stopNode.$.replaceWith(widget.custom.startNode.$copyWithEvents);
                        widget.custom.startNode.$copy.replaceWith(widget.custom.stopNode.$copyWithEvents);
                        widget.custom.startNode.$.remove();

                        widget.custom.startNode.clear();
                        widget.custom.stopNode.clear();
                    } else {
                        //同一元素发生mousedown And mouseup
                        widget.custom.startNode.$.attr('style', widget.custom.startNode.style);
                        widget.custom.startNode.clear();
                        widget.custom.stopNode.clear();
                    }
                } else {
                    //移出编辑器,释放左键,操作无效
                }

                return false;
            });

            $elements.mousedown(function (event) {

                //记录当前坐标，绑定到document
                $document.data('coordinate-x', event.pageX);
                $document.data('coordinate-y', event.pageY);

                var $this = $(this), relativeLeft, relativeTop, $offsetParent, hasCopy;

                //移出编辑器,操作无效
                if (widget.custom.startNode.$) {
                    widget.custom.startNode.$copy.replaceWith(widget.custom.startNode.$copyWithEvents);
                    widget.custom.startNode.$.remove();
                    widget.custom.startNode.clear();
                    widget.custom.stopNode.clear();
                } else {

                    /**
                     * 禁止浏览器默认事件；
                     * 例如：拖拉图片会出现禁止图标
                     */
                    if (event.preventDefault) event.preventDefault();
                    else event.returnValue = false;

                    //获取起到定位父类
                    $offsetParent = $this.offsetParent();

                    widget.custom.startNode.$ = $this;
                    widget.custom.startNode.$copy = $this.clone();
                    widget.custom.startNode.$copyWithEvents = $this.clone(true);
                    widget.custom.startNode.style = $this.attr('style');

                    relativeLeft = event.clientX - parseInt($this.offset().left);
                    relativeTop = event.clientY - parseInt($this.offset().top);

                    $document.mousemove(function (_event) {

                        /**
                         *  兼容其他浏览器: 防止mousedown 事件触发 mousemove事件
                         */
                        if ($document.data('coordinate-x') !== _event.pageX && $document.data('coordinate-y') !== _event.pageY) {

                            if (!hasCopy) {
                                widget.custom.startNode.$copy.insertAfter($this);
                                hasCopy = true;
                            }

                            $this.css({
                                'position': 'absolute',
                                'left': _event.clientX - relativeLeft - parseInt($offsetParent.offset().left),
                                'top': _event.clientY - relativeTop - parseInt($offsetParent.offset().top),
                                'pointer-events': 'none',
                                'opacity': '0.5'
                            });
                        }
                    });


                    $document.mouseup(function () {

                        $document.unbind('mousemove');
                        $document.unbind('mouseup');

                        widget.custom.startNode.$copy.replaceWith(widget.custom.startNode.$copyWithEvents);
                        widget.custom.startNode.$.remove();
                        widget.custom.startNode.clear();
                        widget.custom.stopNode.clear();

                    });
                }

            });

            $elements.mouseover(function (event) {
                var $this = $(this);

                //防止移出编辑器，释放左键
                if (event.which === 1) {
                    if (widget.custom.startNode.$ && widget.custom.startNode.$[0] !== this) {
                        widget.custom.stopNode.$ = $this;
                        widget.custom.stopNode.$copy = $this.clone();
                        widget.custom.stopNode.$copyWithEvents = $this.clone(true);
                        $this.css({
                            'border': '1px solid red'
                        });
                    }
                }

            });

            $elements.mouseout(function (event) {
                var $this = $(this);

                //防止移出编辑器，释放左键
                if (event.which === 1) {
                    if (widget.custom.startNode.$) {
                        if (widget.custom.startNode.$[0] !== this) {
                            widget.custom.stopNode.$.replaceWith(widget.custom.stopNode.$copyWithEvents)
                        } else {
                            /**
                             * 设置 pointer-events:none 时，自身触发 mouseout
                             */
                        }
                    }
                }

            });
        }


    },

    init: function (widget) {
        var $elements;
        $(widget.custom.tags).each(function () {
            $elements = widget.seditor.element.$.find('[' + widget.marker + '="' + this + '"]');
            $elements.length > 0 && widget.custom.swapping($elements, widget);
        });

    }
});
