/**
 * Author: zhanggc
 * Date: 2015/3/31.
 * Todo: 图片上传与链接修改
 */
SEDITOR.plugins.add('link', {

    name: '链接',

    custom: {
        //上传地址
        url: 'http://localhost:8002/Yingping/pic/uploadPicAjax',
        //上传目录
        pathDir: '/simplecms/picDynamic/4/',

        $dialog: $('<div style="display: none;"></div>'),
        content: {
            main: '<div style="width:100%;">' +
                '<div a-pan style="margin-bottom: 32px;"><span>链接：</span><div container style="padding: 12px 8px; border: 1px solid rgb(168, 166, 166);"></div></div>' +
                '<div image-pan style="margin-bottom: 32px;"><span>图片：</span><div container style="padding: 12px 8px; border: 1px solid rgb(168, 166, 166);"><form name="form" action="" method="POST" enctype="multipart/form-data" style="margin-bottom: 12px;"><input type="file" id="linkFileUpload" name="picUpload"><span class="button"><input type="button"  value="上传" id="linkUpload" disabled></span><div style="padding-top: 8px;" id="linkUploadResult">提示：名称只能以数字+英文+空格+加减符号</div></form><div data-view style="margin-bottom: 12px;"><div>预览</div><div style="border: 1px solid rgb(199, 199, 199); overflow-y: scroll; width: 354px; padding: 2px; background-color: white; overflow-x: hidden;"><img style="width: 334px;"/></div></div></div></div>' +
                '</div>',
            $main: null,
            a_href: '<div data-href style="margin-bottom: 12px;"><div>URL</div><div><input style="width:320px;"/></div></div>',
            $a_href: null,
            a_title: '<div data-title style="margin-bottom: 12px;"><div>标题</div><div><input style="width:320px;"/></div></div>',
            $a_title: null,
            a_target: '<div data-target style="margin-bottom: 12px;"><div>目标窗口</div><div><select><option value="_self">本窗口</option><option value="_blank">新窗口</option></select></div></div>',
            $a_target: null,
            img_src: null,
            $img_src: null,
            img_alt: '<div data-alt style="margin-bottom: 12px;"><div>替换文本</div><div><input style="width:320px;"/></div></div>',
            $img_alt: null
        },

        //填充对象
        target: {
            $a_href: null,
            $a_title: null,
            $a_target: null,

            $img_src: null,
            $img_alt: null
        },

        //填充对象
        copyTarget: {
            $a_href: null,
            $a_title: null,
            $a_target: null,

            $img_src: null,
            $img_alt: null
        },

        create: function (widget) {
            this.content.$main = $(this.content.main);
            if (!this.target.$a_href && !this.target.$a_title && !this.target.$a_target) {
                this.content.$main.find('[a-pan]').hide();
            } else {
                if (this.target.$a_href) {
                    this.content.$main.find('[a-pan] [container]').append(this.content.$a_href = $(this.content.a_href));
                }

                if (this.target.$a_title) {
                    this.content.$main.find('[a-pan] [container]').append(this.content.$a_title = $(this.content.a_title));
                }

                if (this.target.$a_target) {
                    this.content.$main.find('[a-pan] [container]').append(this.content.$a_target = $(this.content.a_target));
                }
            }

            if (!this.target.$img_src && !this.target.$img_alt) {
                this.content.$main.find('[image-pan]').hide();
            } else {
                if (this.target.$img_src) {
                    var custom = this;

                    //点击上传
                    this.content.$main.find('#linkUpload').click(function () {
                        var value = custom.content.$main.find('#linkFileUpload').val();
                        if (value) {
                            return widget.custom.upload(widget);
                        } else {
                            alert('请选择文件');
                        }
                    });

                    //选择文件
                    this.content.$main.find('#linkFileUpload').change(function () {
                        var value = $(this).val();
                        if (value) {
                            custom.content.$main.find('#linkUpload').removeAttr('disabled');
                        } else {
                            custom.content.$main.find('#linkUpload').attr('disabled', 'disabled');
                        }
                    });
                } else {
                    this.content.$main.find('[image-pan] form').hide();
                    this.content.$main.find('[image-pan] [data-view]').hide();
                }

                if (this.target.$img_alt) {
                    this.content.$main.find('[image-pan] [container]').append(this.content.$img_alt = $(this.content.img_alt));
                }
            }

            this.$dialog.append(this.content.$main)
        },

        remove: function (widget) {
            this.$dialog.empty();
        },

        //查找目标
        findTarget: function (widget) {
            var $dataElements,$dataElement,custom = this;

            $dataElements = SEDITOR.tools.findElements(widget.$element,'data-toggle-a_href');
            $dataElements.each(function () {
                $dataElement = widget.seditor.$(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$element, ['widget-toggle'], $dataElement)){
                    custom.target['$a_href'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$element,'data-toggle-a_title');
            $dataElements.each(function () {
                $dataElement = widget.seditor.$(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$element, ['widget-toggle'], $dataElement)){
                    custom.target['$a_title'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$element,'data-toggle-a_target');
            $dataElements.each(function () {
                $dataElement = widget.seditor.$(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$element, ['widget-toggle'], $dataElement)){
                    custom.target['$a_target'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$element,'data-toggle-img_src');
            $dataElements.each(function () {
                $dataElement = widget.seditor.$(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$element, ['widget-toggle'], $dataElement)){
                    custom.target['$img_src'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$element,'data-toggle-img_alt');
            $dataElements.each(function () {
                $dataElement = widget.seditor.$(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$element, ['widget-toggle'], $dataElement)){
                    custom.target['$img_alt'] = $dataElement;
                    return;
                }
            });


            $dataElements = SEDITOR.tools.findElements(widget.$copyElement,'data-toggle-a_href');
            $dataElements.each(function () {
                $dataElement = $(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$copyElement, ['widget-toggle'], $dataElement)){
                    custom.copyTarget['$a_href'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$copyElement,'data-toggle-a_title');
            $dataElements.each(function () {
                $dataElement = $(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$copyElement, ['widget-toggle'], $dataElement)){
                    custom.copyTarget['$a_title'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$copyElement,'data-toggle-a_target');
            $dataElements.each(function () {
                $dataElement = $(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$copyElement, ['widget-toggle'], $dataElement)){
                    custom.copyTarget['$a_target'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$copyElement,'data-toggle-img_src');
            $dataElements.each(function () {
                $dataElement = $(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$copyElement, ['widget-toggle'], $dataElement)){
                    custom.copyTarget['$img_src'] = $dataElement;
                    return;
                }
            });

            $dataElements = SEDITOR.tools.findElements(widget.$copyElement,'data-toggle-img_alt');
            $dataElements.each(function () {
                $dataElement = $(this);
                if(SEDITOR.tools.widget.hasAttr(widget.$copyElement, ['widget-toggle'], $dataElement)){
                    custom.copyTarget['$img_alt'] = $dataElement;
                    return;
                }
            });

        },

        show: function (widget) {
            widget.custom.$dialog.dialog({
                height: 480,
                width: 477,
                title: '图片编辑',
                modal: true,
                resizable: false,
                dialogClass: 'widget-dialog-jquert-ui',
                open: function (event, ui) {
                    widget.custom.target.$a_href && widget.custom.content.$a_href.find('input').val(widget.custom.target.$a_href.attr('href'));
                    widget.custom.target.$a_title && widget.custom.content.$a_title.find('input').val(widget.custom.target.$a_title.attr('title'));
                    widget.custom.target.$a_target && (function () {
                        if (widget.custom.target.$a_target.attr('target') === '') {
                            widget.custom.content.$a_target.find('select option[value="_self"]').attr('selected', 'selected')
                        } else {
                            widget.custom.content.$a_target.find('select option[value="' + widget.custom.target.$a_target.attr('target') + '"]').attr('selected', 'selected')
                        }
                    })();

                    widget.custom.target.$img_alt && widget.custom.content.$img_alt.find('input').val((widget.custom.target.$img_alt).attr('alt'));
                    widget.custom.target.$img_src && widget.custom.content.$main.find('[data-view] img').attr('src', (widget.custom.target.$img_src).attr('src'));
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

                            widget.custom.target.$a_href && widget.custom.target.$a_href.attr('href', widget.custom.content.$a_href.find('input').val());
                            widget.custom.target.$a_title && widget.custom.target.$a_title.attr('title', widget.custom.content.$a_title.find('input').val());
                            widget.custom.target.$a_target && widget.custom.target.$a_target.attr('target', widget.custom.content.$a_target.find('select').val());

                            widget.custom.target.$img_alt && widget.custom.target.$img_alt.attr('alt', widget.custom.content.$img_alt.find('input').val());
                            widget.custom.target.$img_src && widget.custom.target.$img_src.attr('src', widget.custom.content.$main.find('[data-view] img').attr('src'));

                            widget.custom.copyTarget.$a_href && widget.custom.copyTarget.$a_href.attr('href', widget.custom.content.$a_href.find('input').val());
                            widget.custom.copyTarget.$a_title && widget.custom.copyTarget.$a_title.attr('title', widget.custom.content.$a_title.find('input').val());
                            widget.custom.copyTarget.$a_target && widget.custom.copyTarget.$a_target.attr('target', widget.custom.content.$a_target.find('select').val());

                            widget.custom.copyTarget.$img_alt && widget.custom.copyTarget.$img_alt.attr('alt', widget.custom.content.$img_alt.find('input').val());

                            console.log(widget.custom.copyTarget.$img_src);
                            widget.custom.copyTarget.$img_src && widget.custom.copyTarget.$img_src.attr('src', widget.custom.content.$main.find('[data-view] img').attr('src'));

                            $(this).dialog("close");
                            widget.custom.$dialog.empty();

                        }
                    }
                ]
            });
        },

        //上传
        upload: function (widget) {
            $("#linkUploadResult").text("正在上传，请稍等...");
            $.ajaxFileUpload({
                url: widget.custom.url + "?pathDir=" + widget.custom.pathDir,
                fileElementId: 'linkFileUpload',
                dataType: "text",
                type: 'post',
//                data: {pathDir: widget.custom.pathDir},
                success: function (result) {
                    result = eval("(" + result + ")");
                    if (result['status'] === 'success') {
                        widget.custom.view(result['fileName']);
                        $("#linkUploadResult").text("图片上传成功");
                    } else {
                        $("#linkUploadResult").text("上传失败，文件为空或文件图片格式不正确")
                    }
                },
                error: function (data) {
                    $("#linkUploadResult").text("上传失败，文件为空或文件图片格式不正确")
                }
            });
            return false;
        },

        view: function (fileName) {
            var basesrc = this.target.$img_src.attr('basesrc');
            if (typeof basesrc === 'undefined') {
                basesrc = '';
            } else if (basesrc.lastIndexOf('/') !== (basesrc.length - 1)) {
                basesrc += '/';
            }
            this.content.$main.find('[data-view] img').attr('src', basesrc += fileName);
        }
    },

    run: function (widget) {
        widget.seditor.$dest.append(widget.custom.$dialog);
    },

    placeholder: {
        required: true,
        events: {
            click: function (widget) {
                widget.custom.findTarget(widget);
                widget.custom.create(widget);
                widget.custom.show(widget);
            }
        }
    }

});