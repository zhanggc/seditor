/**
 * Author: zhanggc
 * Date: 2015/3/31.
 * Todo: 图片上传插件
 */

SEDITOR.plugins.add('image', {
    custom: {
        $dialog: $('<div class="widget-image" style="display:none;"></div>'),

        $upload: $('<div class="upload"><form name="form" action="" method="POST" enctype="multipart/form-data"><input type="file" id="imageFileUpload" name="picsUpload" multiple=""><span class="button"><input type="button"  value="上传" id="imageUpload" disabled></span><div style="padding-top: 8px;" id="imageUploadResult">提示：名称只能以数字+英文+空格+加减符号</div></form></div>'),

        $album: $('<div class="album"><div>预览：</div><div class="container"><ul></ul></div></div>'),
        urls: {
            upload: 'http://localhost:8002/Yingping/pic/uploadPicsAjax',
            delete: 'http://localhost:8002/Yingping/pic/deleteAjax',
            query: 'http://localhost:8002/Yingping/pic/listByPathDirAjax'
        },

        pathDir: '/simplecms/pic/4/',

        //正在查询
        showing: false,

        uploading: false,

        cache: [],

        //上传
        upload: function (widget) {
            if (this.uploading) {
                alert('请等待上传');
            } else {
                this.uploading = true;

                $("#imageUploadResult").text("正在上传，请稍等...");
                $.ajaxFileUpload({
                    url: this.urls.upload + "?pathDir=" + this.pathDir,
                    fileElementId: 'imageFileUpload',
                    dataType: "text",
                    type: 'POST',
                    //data: {pathDir: this.pathDir},
                    success: function (result) {
                        result = eval("(" + result + ")");
                        if (result['status'] === 'success') {
                            widget.custom.putCache(widget, result);
                            $("#imageUploadResult").text("图片上传成功");
                        } else {
                            var $list = $('<div style="background: rgb(228, 228, 228); border: 1px solid rgb(193, 193, 193); padding: 8px;"></div>');
                            $(result['pics']).each(function () {
                                if (this.status === 'failure') {
                                    $list.append('<div style="margin: 5px 0;overflow: hidden;">' + this.imageName.substring(this.imageName.lastIndexOf("/") + 1, this.imageName.length) + '</div>');
                                }
                            });
                            widget.custom.putCache(widget, result);
                            $("#imageUploadResult").text('').append("<div>上传失败文件如下：</div>").append($list);
                        }
                        widget.custom.show();

                        widget.custom.uploading = false;
                    },
                    error: function (result) {
                        $("#imageUploadResult").text("上传失败，文件为空或文件图片格式不正确")
                        widget.custom.uploading = false;
                    }
                });
            }

            return false;
        },

        putCache: function (widget, result) {
            var custom = this;
            $(result['pics']).each(function () {
                var $img,
                    cache,
                    fullPath = result.path + this.imageName;

                if (this.exist && this.status === 'success') {
                    cache = custom.getCache(fullPath);
                    if (cache) {
                        cache.fixed = cache.source + "?" + new Date().getTime();
                    } else {
                        cache = {
                            source: fullPath,
                            fixed: fullPath + "?" + new Date().getTime()
                        }
                        custom.cache.push(cache);
                    }

                    $img = widget.seditor.element.$.find('img[src="' + cache.source + '"]');
                    if ($img.length > 0) {
                        $img.attr('src', cache.fixed);
                    }
                }
            });
        },

        getCache: function (fullPath) {
            var shot;
            $(this.cache).each(function () {
                if (fullPath == this.source) {
                    shot = this;
                }
            });
            return shot;
        },

        show: function () {
            var custom = this;
            if (!custom.showing) {
                custom.showing = true;
                var $ul = custom.$album.find('ul');
                $ul.empty();
                $.ajax({
                    type: 'get',
                    url: custom.urls.query,
                    dataType: 'json',
                    data: {pathDir: custom.pathDir},
                    success: function (result) {
                        if (result['status'] === 'success') {
                            var path = result['path'],
                                $li = $('<li></li>');
                            $(result['pics']).each(function (index) {
                                var cache = custom.getCache(path + this);
                                if (cache) {
                                    $li.append('<span><img style="width:60px;height:60px;" imageName="' + this + '" src="' + cache.fixed + '" /><span class="del" style="display: none;">删除</span></span>');
                                } else {
                                    $li.append('<span><img style="width:60px;height:60px;" imageName="' + this + '" src="' + path + this + '" /><span class="del" style="display: none;">删除</span></span>');
                                }

                            });
                            $ul.append($li);
                            $li.append('<div style="clear:both"></div>');
                            $ul.find('li>span').hover(
                                function () {
                                    $(this).find('.del').show();
                                },
                                function () {
                                    $(this).find('.del').hide();
                                }
                            );
                            $ul.find('.del').click(function () {
                                if (custom.uploading) {
                                    alert("请等待上传处理");
                                } else {
                                    var $img = $(this).prev();
                                    var sure = confirm('是否删除')
                                    if (sure) {
                                        $.ajax({
                                            type: 'post',
                                            url: custom.urls.delete,
                                            dataType: 'json',
                                            data: {imageName: $img.attr('imageName')},
                                            success: function (result) {
                                                if (result['status'] === 'success') {
                                                    $img.parent().remove();
                                                } else {
                                                    alert('删除失败');
                                                }
                                            },
                                            error: function () {
                                                alert('删除失败');
                                                custom.showing = false;
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            alert('查询失败');
                        }

                        custom.showing = false;
                    },
                    error: function () {
                        alert('查询失败');
                        custom.showing = false;
                    }
                });
            }
        }
    },

    filter: function (widget) {
        var $content = widget.seditor.getCopyElement(),
            $img;
        $(widget.custom.cache).each(function () {
            $img = $content.find('img[src="' + this.fixed + '"]');
            if ($img.length > 0) {
                $img.attr('src', this.source);
            }
        });
        widget.seditor.getConfig().content.data = $content.html();
    },

    run: function (widget) {
        widget.custom.$dialog.append(widget.custom.$upload).append(widget.custom.$album);
        widget.seditor.$dest.append(widget.custom.$dialog);

        widget.custom.$upload.find('#imageUpload').click(function () {
            var value = widget.custom.$upload.find('#imageFileUpload').val();
            if (value) {
                return widget.custom.upload(widget);
            } else {
                alert('请选择文件');
            }
        });
        widget.custom.$upload.find('#imageFileUpload').change(function () {
            var value = $(this).val();
            if (value) {
                widget.custom.$upload.find('#imageUpload').removeAttr('disabled');
            } else {
                widget.custom.$upload.find('#imageUpload').attr('disabled', 'disabled');
            }
        });
    },

    //工具栏
    toolbar: {

        //是否必须
        required: true,

        title: '图片上传',

        events: {
            click: function (widget) {
                widget.custom.$dialog.dialog({
                    height: 350,
                    width: 477,
                    title: '图片上传',
                    modal: true,
                    resizable: false,
                    dialogClass: 'widget-dialog-jquert-ui',
                    close: function (event, ui) {
                        widget.custom.uploading = false;
                    },
                    open: function (event, ui) {
                        widget.custom.show();
                    }

                });
            }
        }
    }
});
