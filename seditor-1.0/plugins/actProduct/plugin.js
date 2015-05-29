/**
 * Author: zhanggc
 * Date: 2015/4/14.
 * Todo: 活动商品插件
 */

SEDITOR.plugins.add('actProduct', {

    custom: {
        $dialog: $('<div class="widget-actProduct" style="display: none;"></div>'),
        urls: {
            query: ''
        },

        /*
         * 从页面获取
         */
        basesrc: '',

        //标识当前查询状态
        searching: false,


        content: {
            part1: {
                main: '<div style=" text-align: center; padding: 12px 0; "></div>',
                $main: null,
                search: '<div class="search"><input type="text" style="width: 212px;" /> <input  type="button" value="查询"/> </div>',
                $search: '',
                tablelist: '<div class="tablelist"><table cellpadding="0" cellspacing="0"><thead><th>展示</th><th>名称</th><th>活动</th></thead><tbody></tbody></table></div></div>',
                $tablelist: ''
            },
            part2: {
                main: '<div></div>',
                $main: null,
                name: '<div data-toggle-name style="margin-bottom: 12px;"><span>名称: </span><input style="width:100px;"></div>',
                $name: null,
                mprice: '<div data-toggle-mprice style="margin-bottom: 12px;"><span>市场价: </span><input style="width:100px;"></div>',
                $mprice: null,
                image: '<div data-toggle-img style="margin-bottom: 12px;"><div>预览</div><div style="border: 1px solid rgb(199, 199, 199); overflow-y: scroll; width: 354px; padding: 2px; background-color: white; overflow-x: hidden;"><img style="width: 334px;"/></div></div>',
                $image: null
            }
        },
        target: {
            $name: null,
            $mprice: null,
            $image: null
        },

        cache: {
            kw: '',
            page: '',
            max: 12
        },

        //组成对话框
        create: function (widget) {
            this.content.part1.$main = $(this.content.part1.main);
            this.content.part1.$search = $(this.content.part1.search);
            this.content.part1.$main.append(this.content.part1.$search);
            this.content.part1.$tablelist = $(this.content.part1.tablelist);
            this.content.part1.$main.append(this.content.part1.$tablelist);
            this.$dialog.append(this.content.part1.$main);

            this.content.part1.$search.find('input[type="button"]').click(function () {
                widget.custom.search( widget, {
                    kw: widget.custom.cache.kw = widget.custom.content.part1.$search.find('input[type="text"]').val(),
                    page: 1,
                    max: widget.custom.cache.max
                });
            });
        },

        //查找标识元素
        findTarget: function (widget) {
            var $imgs = widget.$element.find('[data-toggle-img="src"]');
            if ($imgs.length > 0) {
                var basesrc = $($imgs[0]).attr('basesrc');
                if (typeof basesrc === 'undefined') {
                    basesrc = '';
                } else if (basesrc.lastIndexOf('/') !== (basesrc.length - 1)) {
                    basesrc += '/';
                }

                this.basesrc = basesrc;
            }
        },

        //显示对话框
        open: function (widget) {
            widget.custom.$dialog.dialog({
                height: 480,
                width: 677,
                title: '活动商品编辑',
                modal: true,
                resizable: false,
                dialogClass: 'widget-dialog-jquert-ui',
                open: function (event, ui) {

                },
                close: function (event, ui) {
                    widget.custom.$dialog.empty();
                },
                buttons: [
                    {
                        text: "确定",
                        icons: {
                            primary: "ui-icon-heart"
                        },
                        click: function () {
                            var $product = widget.custom.content.part1.$tablelist.find('tbody tr.selected');
                            if ($product.length === 1) {
                                widget.custom.fillData(widget, $product.data('pro'));
                            }

                            widget.custom.$dialog.empty();
                            widget.custom.$dialog.dialog('close');
                        }
                    }
                ]
            });
        },

        search: function (widget, config) {
            //锁查询
            widget.custom.lock(widget)();

            $.ajax({
                type: 'post',
                url: this.urls.query,
                data: config,
                dataType: 'json',
                success: function (result) {
                    if (result && result['status'] === 'success') {
                        widget.custom.show(widget, result);
                    } else {
                        //fail
                    }

                    //释放查询
                    widget.custom.unlock(widget)();
                },
                error: function (result) {
                    //释放查询
                    widget.custom.unlock(widget)();
                }
            });

            //test
            /* $.getJSON("http://localhost:63342/seditor/seditor-1.1/plugins/actProduct/data.json", config,
             function (result) {
             if (result && result['status'] === 'success') {
             widget.custom.show(widget, result);
             } else {
             //fail
             }
             });*/
        },

        show: function (widget, result) {
            var $items, $item, item = '<tr><td><img /></td><td><div></div></td><td><div></div></td></tr>',
                $tbody = this.content.part1.$tablelist.show().find('tbody').empty();

            widget.custom.cache.kw = result['kw'];
            widget.custom.cache.page = parseInt(result['page']);
            widget.custom.cache.max = parseInt(result['max']);

            this.content.part1.$tablelist.find('.page').remove();

            $(result['proList']).each(function () {
                $item = $(item);
                if(this.img){
                    $($item.find('td')[0]).find('img').attr('src', widget.custom.basesrc + this.img);
                }else{
                    $($item.find('td')[0]).find('img').replaceWith('<div class="img-miss">暂无图片</div>');
                }
                $($item.find('td')[1]).find('div').text(this.name);
                $($item.find('td')[2]).find('div').text(this.activityName);
                $item.data('pro', this);
                $tbody.append($item);
            });

            //绑定事件
            $items = $tbody.find('tr');
            $items.click(function () {
                $items.removeClass('selected');
                $(this).addClass('selected');
            });

            //创建分页
            this.page.create(widget, result);
        },

        //锁查询
        lock: function (widget) {
            var $this = this;
            return (function () {
                $this.content.part1.$search.find('[type="button"]').attr('disabled', 'disabled');
            });
        },

        //释放查询
        unlock: function (widget) {
            var $this = this;
            return (function () {
                $this.content.part1.$search.find('[type="button"]').removeAttr('disabled');
            });
        },

        //分页
        page: {
            html: '<div class="page"><ul></ul><div class="clear"></div></div>',
            $html: null,
            create: function (widget, result) {
                this.$html = $(this.html);
                widget.custom.content.part1.$tablelist.append(this.$html);
                this.load(this.data(result));

                this.$html.find('ul li a.selectable').click(function () {
                    widget.custom.search(widget, {
                        kw: widget.custom.cache.kw,
                        page: widget.custom.cache.page = $(this).text(),
                        max: widget.custom.cache.max
                    });
                });
                this.$html.find('ul li a.up').click(function () {
                    widget.custom.search(widget, {
                        kw: widget.custom.cache.kw,
                        page: widget.custom.cache.page -= 1,
                        max: widget.custom.cache.max
                    });
                });
                this.$html.find('ul li a.next').click(function () {
                    widget.custom.search(widget, {
                        kw: widget.custom.cache.kw,
                        page: widget.custom.cache.page += 1,
                        max: widget.custom.cache.max
                    });
                });
                this.$html.find('ul li select').change(function () {
                    widget.custom.search(widget, {
                        kw: widget.custom.cache.kw,
                        page: widget.custom.cache.page = parseInt($(this).val()),
                        max: widget.custom.cache.max
                    });
                });
            },
            data: function (result) {
                var data = {},
                    count = parseInt(result['count']),
                    max = parseInt(result['max']),
                    totalpage = Math.ceil(count / max),
                    currentpage = parseInt(result['page']);
                data['totalpage'] = totalpage;
                data['currentpage'] = currentpage;
                return data;
            },
            load: function (data) {
                var $ul = this.$html.find('ul');
                var $select = $('<li><select class="p_select"></select></li>');
                if (data.totalpage <= 1) {
                    return;
                }
                for (var i = 0; i < data.totalpage; i++) {
                    var $li;
                    if (i < 10) {
                        if (i == data.currentpage - 1) {
                            $li = $('<li><a href="javascript:void(0)" class="current p">' + (i + 1) + '</a></li>');
                        } else {
                            $li = $('<li><a href="javascript:void(0)" class="selectable p">' + (i + 1) + '</a></li>');
                        }
                    } else {
                        if (i == data.currentpage - 1) {
                            $select.find('select').append($('<option selected value="' + (i + 1) + '">第' + (i + 1) + '页</option>'));
                        } else {
                            $select.find('select').append($('<option value="' + (i + 1) + '">第' + (i + 1) + '页</option>'));
                        }

                    }
                    $ul.append($li);
                }

                //大于5页,用于下拉框显示
                if (data.totalpage >= 10) {
                    $ul.append($select);
                }

                if (data.currentpage != 1) {
                    $ul.prepend($('<li><a href="javascript:void(0)" class="p up">上一页</a></li>'));
                }
                if (data.currentpage != data.totalpage) {
                    $ul.append($('<li><a href="javascript:void(0)" class="p next">下一页</a></li>'));
                }
            }
        },

        //填充数据
        fillData: function (widget, data) {
            var $dataElements, $dataElement, label, custom = this, position, map = this.map;
            for (var fieldName in map) {
                label = 'data-toggle-' + fieldName;

                $dataElements = SEDITOR.tools.findElements(widget.$element,label);
                $dataElements.each(function () {
                    $dataElement = widget.seditor.$(this);
                    if (SEDITOR.tools.widget.hasAttr(widget.$element, ['widget-toggle'], $dataElement)) {
                        position = $dataElement.attr(label);
                        custom.fillDataToPosition($dataElement, label, position, data[map[fieldName]]);
                    }
                });

                $dataElements = SEDITOR.tools.findElements(widget.$copyElement,label);
                $dataElements.each(function () {
                    $dataElement = $(this);
                    if (SEDITOR.tools.widget.hasAttr(widget.$copyElement, ['widget-toggle'], $dataElement)) {
                        position = $dataElement.attr(label);
                        custom.fillDataToPosition($dataElement, label, position, data[map[fieldName]]);
                    }
                });
            }
        },



        /**
         * 根据属性位置填充数据
         * Params
         *  - $element 将要填充数据元素
         *  - lable 元素标识标签
         *  - position 标签位置
         *  - data 填充数据
         **/
        fillDataToPosition: function ($element, label, position, data) {

            //任意不为空
            if (!$element || !label || !position)  return;

            //样式类
            if (position === 'class') {

                //评分
                if (label === 'data-toggle-ratingWithStar') {
                    $element.attr('class', SEDITOR.tools.widget.replaceClass($element.attr('class'), ['s0', 's1', 's2', 's3', 's4', 's5'], 's' + data));
                } else {
                    $element.addClass(data);
                }

            } else if (position === 'text') {  //元素文本
                $element.text(data);
            } else if (position === 'src') {  //图片src
                var basesrc = $element.attr('basesrc');
                if (typeof basesrc === 'undefined') {
                    basesrc = '';
                } else if (basesrc.lastIndexOf('/') !== (basesrc.length - 1)) {
                    basesrc += '/';
                }
                $element.attr(position, basesrc + data);
            } else {
                $element.attr(position, data);
            }
        },

        //页面标签字段与后台字段匹配
        map: {
            id: 'id',
            name: 'name',
            shortName: 'shortName',
            mprice: 'mprice',
            lprice: 'lprice',
            hprice: 'hprice',
            hlprice: 'hlprice',
            hhprice: 'hhprice',
            remark: 'remark',
            ratingWithStar: 'rating',
            ratingWithFont: 'rating',
            hrefOnMob: 'hrefOnMob',
            hrefOnPC: 'hrefOnPC',
            img: 'img'
        }
    },

    placeholder: {
        required: true,
        events: {
            click: function (widget) {
                widget.custom.findTarget(widget);
                widget.custom.create(widget);
                widget.custom.open(widget);
            }
        }
    }

});
