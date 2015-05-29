/**
 * Author: zhanggc
 * Date: 2015/3/27.
 * Version: 1.1
 * Statements: SEditor is means sample editor; Copyright (c) 2015, Zhanggc. All rights reserved.
 * For licensing, please follow GPL, see http://opensource.org/licenses/gpl-license
 */
(function () {
    window.SEDITOR || (window.SEDITOR = new function () {

        //基本路径
        this.basePath = function () {
            var a = window.SEDITOR_PATH || "";
            if (!a)for (var d = document.getElementsByTagName("script"), f = 0; f < d.length; f++) {
                var b = d[f].src.match(/(^|.*[\\\/])seditor(?:_basic)?(?:_source)?.js(?:\?.*)?$/i);
                if (b) {
                    a = b[1];
                    break
                }
            }
            -1 == a.indexOf(":/") && "//" != a.slice(0, 2) && (a = 0 === a.indexOf("/") ? location.href.match(/^.*?:\/\/[^\/]*/)[0] +
                a : location.href.match(/^[^\?]*\/(?:)/)[0] + a);
            if (!a)throw'The SEditor installation path could not be automatically detected. Please set the global variable "SEDITOR_BASEPATH" before creating editor instances.';
            return a
        }();

        //命名前缀
        this.prefix = 'seditor';

        //EDITOR实例集合
        this.instances = {};

        //配置
        this._config = {
            fileName: 'config',
            plugins: [],
            neededScripts: {
                'jquery': {
                    key: 'jquery-1',
                    path: ''
                },
                'jquery-ui': {
                    key: 'jquey-ui',
                    path: ''
                }
            },

            //实例初始化数据
            instances: {},

            //部件初始化数据
            widgets: {},

            //配置文件是否加载完毕
            readyState: false
        };

        //获取配置
        this.getConfig = function () {
            return this._config;
        };

        this.getModel = function () {
            if (!this._config.model) {
                this._config.model = 'normal';
            }
            return this._config.model;
        };

        this.setModel = function (model) {
            if (model === 'inline') this._config.model = 'inline';
            else  this._config.model = 'normal';
        };


        //部件配置
        this.setWidgetConfig = function (name, config) {
            if ($.trim(name) && typeof config === 'object') {
                SEDITOR.getConfig().widgets[name] = config;
            }
        };

        this.getWidgetConfig = function (name) {
            return SEDITOR.getConfig().widgets[name];
        };

        //配置指定实例
        this.setEditorConfig = function (name, config) {
            if ($.trim(name)) {
                SEDITOR.getConfig().instances[name] = {};
                SEDITOR.getConfig().instances[name]['data'] = $.trim(config['data']);

                //数组或字符串
                if (Object.prototype.toString.call(config['styleSheets']) === '[object Array]') {
                    SEDITOR.getConfig().instances[name]['styleSheets'] = config['styleSheets'];
                }
                if (Object.prototype.toString.call(config['scripts']) === '[object Array]') {
                    SEDITOR.getConfig().instances[name]['scripts'] = config['scripts'];
                }

                if (typeof config['height'] === 'string') {
                    SEDITOR.getConfig().instances[name]['height'] = config['height'];
                }
            }
        };

        //获取指定实例配置
        this.getEditorConfig = function (name) {
            return SEDITOR.getConfig().instances[name];
        };

        //加载配置
        this.loadConfig = function () {
            //加载配置
            $.getScript(this.basePath + SEDITOR.getConfig().fileName + '.js', function () {
                SEDITOR.setConfig(SEDITOR.getConfig());
                $(SEDITOR.getConfig().plugins).each(function () {
                    $.getScript(SEDITOR.plugins.basePath + this + '/plugin.js');
                });

                //检测注册状态
                var handlerId = setInterval(function () {
                    var size = 0;
                    for (var key in SEDITOR.plugins.registered) {
                        size++;
                    }
                    if (size === SEDITOR.getConfig().plugins.length) {

                        //注册完毕
                        SEDITOR.getConfig().readyState = true;

                        clearInterval(handlerId);
                    }
                }, 100);

            });

        };

        //加载样式
        this.loadSkins = function () {
            var skinName = 'seditor',
                css;
            if (this.getModel() === 'inline') {
                css = '<link rel="stylesheet" type="text/css" href="' + this.basePath + 'skins/inline/' + skinName + '.css" >';
            } else {
                css = '<link rel="stylesheet" type="text/css" href="' + this.basePath + 'skins/normal/' + skinName + '.css" >';
            }

            $('head').append(css);
        };

        //加载依赖脚本
        this.loadScripts = function () {
            var scripts = document.getElementsByTagName('script'),
                tag,
                exist;
            for (var key in this.getConfig().neededScripts) {
                for (var index; index < scripts.length; index++) {
                    if (typeof scripts[index].src !== 'undefined') {
                        if (scripts[index].src.search(this.getConfig().neededScripts[key]['key']) !== -1) {
                            exist = true;
                        }
                    }
                }

                if (!exist) {
                    tag = document.createElement("script");
                    tag.type = "text/javascript";
                    tag.src = this.getConfig().neededScripts[key]['path'];
                    document.head.appendChild(tag);
                }
            }
        };

        //与内部通讯握手
        //win 内部window对象
        this.shakeHands = function (win) {
            for (var key in this.instances) {
                if (this.instances[key].window == win) {
                    //关联内部编辑器
                    this.instances[key].shakeHands(win);
                    return this.instances[key];
                }
            }

            return null;
        };

        //构造函数
        this.SEditor = function (name, $dest, plugins) {

            //与内部同步状态
            this.synchronized = false;

            //内部window
            this.window = null;

            //内部document
            this.document = null;


            //实例配置
            this.config = {
                plugins: plugins,
                content: {
                    data: '',
                    styleSheets: [],
                    scripts: [],
                    neededScripts: [],
                    neededStyleSheets: [],
                    height: '',
                    width: ''
                },
                model: ''    //normal,inline
            };

            //SEditor 依附元素
            this.$dest = $dest;

            //iframe
            this.$iframe = null;

            //内部内容元素
            this.element = null;

            //外部内容元素
            this.copyElement = {
                $: $('<body></body>'),
                readyState: false
            };

            //内部SEDITORUTILS
            this.SEDITORUTILS = null;

            //JQuery
            this.$ = null;

            //名称
            this.name = name;

            this.widgets = {};

            //布局
            this.layout = {
                html: '<div class="sed_container"><div class="sed_top" ></div><div class="sed_contents"></div><div class="sed_bottom"></div></div>',

                //初始化
                create: function (seditor) {

                    var $html = $(this.html);
                    $html.find('.sed_contents').height(seditor.getConfig().content.height);

                    //创建布局
                    seditor.$dest.append($html);

                    //创建iframe
                    this.iframe.create(seditor);
                },

                model: {
                    init: function (seditor, state) {
                        if (seditor.getModel() === 'inline') {
                            seditor.layout.model.inline[state](seditor);
                        } else {
                            seditor.layout.model.normal[state](seditor);
                        }
                    },
                    normal: {
                        state: true,
                        sources: function (seditor) {
                        },
                        view: function (seditor) {
                        }
                    },
                    inline: {
                        state: true,//true:show,false:hide
                        sources: function (seditor) {
                            var inline = this, handlerId, $textarea,
                                $top = seditor.$dest.find('.sed_top'),
                                $textarea = seditor.$dest.find('textarea');
                            if ($textarea.length > 0) {
                                $textarea.dblclick(function () {
                                    if (inline.state) {
                                        $top.hide();
                                        inline.state = false;
                                    } else {
                                        $top.show();
                                        inline.state = true;
                                    }
                                });
                            } else {
                                handlerId = setInterval(function () {
                                    $textarea = seditor.$dest.find('textarea');
                                    if ($textarea.length > 0) {
                                        $textarea.dblclick(function () {
                                            if (inline.state) {
                                                $top.hide();
                                                inline.state = false;
                                            } else {
                                                $top.show();
                                                inline.state = true;
                                            }
                                        });
                                        clearInterval(handlerId);
                                    }
                                }, 100);
                            }

                        },
                        view: function (seditor) {
                            var inline = this, handlerId, $innerHtml, $top = seditor.$dest.find('.sed_top');
                            if (seditor.element != null && typeof seditor.element.$ !== 'undefined') {
                                $innerHtml = seditor.element.$.parents('html');
                                $innerHtml.dblclick(function () {
                                    if (inline.state) {
                                        $top.hide();
                                        inline.state = false;
                                    } else {
                                        $top.show();
                                        inline.state = true;
                                    }
                                });
                            } else {
                                handlerId = setInterval(function () {
                                    if (seditor.element != null && typeof seditor.element.$ !== 'undefined') {
                                        $innerHtml = seditor.element.$.parents('html');
                                        $innerHtml.dblclick(function () {
                                            if (inline.state) {
                                                $top.hide();
                                                inline.state = false;
                                            } else {
                                                $top.show();
                                                inline.state = true;
                                            }
                                        });

                                        clearInterval(handlerId);
                                    }
                                }, 100);
                            }
                        }
                    }
                },

                //創建
                iframe: {

                    readyState: false,

                    html: function () {
                        return '<iframe style="width:100%;height:100%" src="' + SEDITOR.basePath + 'iframe/index.html"></iframe>';
                    },

                    //创建
                    create: function (seditor, widget) {
                        var iframe = this;

                        seditor.$iframe = $(this.html());
                        seditor.$dest.find('.sed_contents').append(seditor.$iframe);

                        //加载window document
                        seditor.$iframe.load(function () {
                            seditor.window = seditor.$iframe[0].contentWindow;

                            //内部document
                            seditor.document = seditor.$iframe[0].contentDocument;

                            seditor.neededScripts(seditor.getConfig().content.neededScripts);

                            iframe.readyState = true;

                            //模式初始化
                            seditor.layout.model.init(seditor, 'view');

                        });

                    },

                    //移除iframe
                    remove: function (seditor) {
                        seditor.$iframe.remove();

                        this.readyState = false;

                        //模式初始化
                        seditor.layout.model.init(seditor, 'sources');

                        seditor.clear();
                    }
                }

            };

            /**
             * 编辑器过滤
             *  - 过滤 部件标识
             */
            this.filter = function () {
                var $instances;
                for (var key in this.widgets) {
                    $instances = this.copyElement.$.find('[' + this.widgets[key].marker + '="' + this.widgets[key].id + '"]');
                    $instances.each(function () {
                        $(this).removeAttr('identity-toggle');
                    });
                }
            };

            //设置
            this.setData = function () {
                var seditor = this;
                var handlerId = setInterval(function () {
                    if (seditor.element) {
                        seditor.styleSheets(seditor.getConfig().content.styleSheets);
                        seditor.neededScripts(seditor.getConfig().content.scripts);
                        seditor.element.$.empty()[0].innerHTML = seditor.getConfig().content.data;
                        seditor.copyElement.$.empty()[0].innerHTML = seditor.getConfig().content.data;
                        seditor.parseScript();

                        //部件初始化
                        for (var key in seditor.widgets) {
                            seditor.widgets[key].init();
                        }

                        seditor.bindEvents();

                        //已加载数据
                        seditor.element.readyState = true;
                        seditor.copyElement.readyState = true;

                        clearInterval(handlerId);
                    }
                }, 100);
            };

            this.getConfig = function () {
                return this.config;
            };

            //获取数据
            this.getData = function () {
                var $textarea;
                if (($textarea = this.$dest.find('.sed_contents textarea')).length > 0) {
                    this.copyElement.$.empty()[0].innerHTML = $textarea.val();
                }

                //过滤
                this.filter();
                return this.getConfig().content.data = this.copyElement.$.html();
            };

            //初始化
            //widgets
            this.init = function () {

                //设置依赖脚本
                this.getConfig().content['neededScripts'] = ['../' + SEDITOR.getConfig().neededScripts['jquery']['path']];

                //设置空数据
                //注意: 可以认为在使用widget(sources)时，数据已准备
                var config = SEDITOR.getEditorConfig(this.name);
                if (config) {
                    this.getConfig().content['data'] = $.trim(config['data']);
                    if (Object.prototype.toString.call(config['styleSheets']) === '[object Array]') {
                        this.getConfig().content['styleSheets'] = config['styleSheets'];
                    }
                    if (Object.prototype.toString.call(config['scripts']) === '[object Array]') {
                        this.getConfig().content['scripts'] = config['scripts'];
                    }

                    if ($.trim(config['height']) !== '') {
                        this.getConfig().content['height'] = config['height'];
                    } else {
                        this.getConfig().content['height'] = '560px';
                    }

                    this.getConfig()['model'] = SEDITOR.getModel();
                }

                //创建布局
                this.layout.create(this);

                //设置数据
                this.setData();

                //初始化WIDGET
                var seditor = this,
                    widget;

                $(this.getConfig().plugins).each(function () {
                    var name = this,
                        widgetConfig;
                    if (typeof SEDITOR.plugins.registered[name] !== 'undefined') {

                        seditor.widgets[name] = new SEDITOR.plugins.widget();

                        for (var key in seditor.widgets[name]['definition']) {
                            if (typeof SEDITOR.plugins.registered[name][key] !== 'undefined' && SEDITOR.plugins.registered[name][key] != null) {
                                seditor.widgets[name]['definition'][key] = SEDITOR.plugins.registered[name][key];
                            }
                        }

                        for (var key in SEDITOR.plugins.registered[name]['custom']) {
                            seditor.widgets[name]['custom'][key] = SEDITOR.plugins.registered[name]['custom'][key];
                        }

                        //部件初始化自定义配置
                        widgetConfig = SEDITOR.getWidgetConfig(name);
                        if (widgetConfig) {
                            for (var key in widgetConfig) {
                                seditor.widgets[name]['custom'][key] = widgetConfig[key];
                            }
                        }

                        //部件唯一标识
                        seditor.widgets[name]['id'] = name;

                        //设置引用
                        seditor.widgets[name]['seditor'] = seditor;

                        seditor.widgets[name].run(seditor.widgets[name]);

                    }
                });
            };

            //绑定事件
            this.bindEvents = function () {
                this.defaultEvents();

                var widget;
                for (var key in this.widgets) {
                    widget = this.widgets[key];
                    for (key in  widget.definition.content.events) {
                        typeof widget.content.wrapEvents[key] != 'undefined'
                        && widget.content.wrapEvents[key](widget, widget.definition.content.events[key]);
                    }

                    for (key in  widget.definition.placeholder.events) {
                        typeof widget.placeholder.wrapEvents[key] != 'undefined'
                        && widget.placeholder.wrapEvents[key](widget, widget.definition.placeholder.events[key]);
                    }

                }

            };

            //默认事件
            this.defaultEvents = function () {
                //禁止<a> 标签跳转
                this.element.$.find('a').click(function () {
                    return false;
                });
            };

            this.getModel = function () {
                if (!this.config.model) {
                    this.config.model = 'normal';
                }
                return this.config.model;
            }

            this.setModel = function (model) {
                if (model === 'inline') this.config.model = 'inline';
                else  this.config.model = 'normal';
            }

            //与内部绑定数据
            this.shakeHands = function (win) {
                this.window = win;
                this.$ = win.SEDITORUTILS.$;
                this.SEDITORUTILS = win.SEDITORUTILS;
                this.element = win.SEDITORUTILS.element;

                //已同步
                this.synchronized = true;
            };

            //清除同步数据
            this.clear = function () {
                this.$iframe = null;
                this.window = null;
                this.document = null;
                this.$ = null;
                this.SEDITORUTILS = null;
                this.element = null;

                //标记未同步
                this.synchronized = false;
            };

            //获取指定部件
            //id 部件标识
            this.widget = function (id) {
                for (var key in this.widgets) {
                    if (key === id) {
                        return this.widgets[key];
                    }
                }
            };

            //插入脚本
            //obj 脚本路径或一组脚本路径
            this.scripts = function (paths) {
                if (Object.prototype.toString.call(paths) === '[object Array]') {
                    this.getConfig().content.scripts = paths;
                    if (typeof this.SEDITORUTILS !== 'undefined' && this.SEDITORUTILS != null) {
                        this.SEDITORUTILS.scripts(paths);
                    }
                }
            };

            //插入样式,
            //paths 样式路径或一组脚本路径
            this.styleSheets = function (paths) {
                if (Object.prototype.toString.call(paths) === '[object Array]') {
                    this.getConfig().content.styleSheets = paths;
                    if (typeof this.SEDITORUTILS !== 'undefined' && this.SEDITORUTILS != null) {
                        this.SEDITORUTILS.styleSheets(paths);
                    }
                }
            };



            //依赖脚本
            this.neededScripts = function (paths) {
                var seditor = this,
                    tag;
                if (Object.prototype.toString.call(paths) === '[object Array]') {
                    $(paths).each(function () {
                        tag = seditor.document.createElement("script");
                        tag.type = "text/javascript";
                        tag.src = this;

                        seditor.document.head.appendChild(tag);
                    });
                } else if (typeof paths == "string") {
                    tag = seditor.document.createElement("script");
                    tag.type = "text/javascript";
                    tag.src = paths;

                    seditor.document.head.appendChild(tag);
                }
            };

            //脚本同步控制
            this.scriptManager = {
                //需要加载数目
                count:0,
                events:{
                    onload:function(){
                        count--;
                    }
                }
            };

            //依赖样式
            this.neededStyleSheets = function (paths) {
                var tag;
                if (Object.prototype.toString.call(paths) === '[object Array]') {
                    $(paths).each(function () {
                        tag = seditor.document.createElement("link");
                        tag.type = "text/css";
                        tag.rel = "stylesheet";
                        tag.href = this;
                        seditor.document.head.appendChild(tag);
                    });
                } else if (typeof paths == "string") {
                    tag = seditor.document.createElement("link");
                    tag.type = "text/css";
                    tag.rel = "stylesheet";
                    tag.href = paths;
                    seditor.document.head.appendChild(tag);
                }
            };

            //格式化脚本
            this.parseScript = function () {
                var seditor = this;
                var $scripts = seditor.element.$.find('script');
                $($scripts).each(function () {
                    var $this = seditor.$(this),
                        $marker = seditor.$('<div></div>').insertBefore(this),
                        scriptTag = seditor.document.createElement("script");
                    scriptTag.type = "text/javascript";
                    if (typeof $this.attr('src') === 'undefined') {
                        scriptTag.innerHTML = this.innerHTML;
                    } else {
                        scriptTag.src = this.src;
                    }

                    $this.parent()[0].insertBefore(scriptTag, $marker[0]);
                    $this.remove();
                    $marker.remove();
                });
            }


        };

        //获取SEditor实例
        this.getSEditor = function (name) {
            for (var key in this.instances) {
                if (key === name) {
                    return this.instances[key];
                }
            }
        };

        //编辑器创建
        this.create = function (name, $dest, plugins) {

            //编辑器
            var seditor = new this.SEditor(name, $dest, plugins),
                handlerId;

            //初始化
            handlerId = setInterval(function () {
                if (SEDITOR.getConfig().readyState) {
                    seditor.init();

                    //清除定时器
                    clearInterval(handlerId);
                }
            }, 100);

            this.instances[name] = seditor;

        };

        //检测当前文档相关标签
        this.detect = {
            byClass: function () {

                var handlerId = setInterval(function () {

                    if (SEDITOR.getConfig().readyState) {
                        //创建编辑器
                        $('.seditor').each(function (index) {
                            var name = $(this).attr('name'), plugins = $(this).attr('plugins');
                            if ($.trim(name) === '') {
                                name = SEDITOR.prefix + index;
                            }
                            if (typeof SEDITOR.getSEditor(name) === 'undefined') {
                                if (typeof plugins === 'undefined' || !$.trim(plugins)) {
                                    plugins = SEDITOR.getConfig().plugins;
                                } else {
                                    plugins = plugins.split(',');
                                }

                                SEDITOR.create(name, $(this), plugins);

                            }
                        });

                        clearInterval(handlerId);
                    }

                }, 100);

            }
        };

    }());


    //插件管理
    SEDITOR.plugins = {

        basePath: SEDITOR.basePath + 'plugins/',

        //添加插件
        add: function (name, config) {
            this.registered[name] = config;
        },

        //已经注册部件
        registered: {},

        //部件构造函数
        widget: function () {

            //可复写属性
            this.definition = {

                //工具栏
                toolbar: {

                    //是否必须
                    required: false,

                    //工具栏提示
                    title: '',

                    //工具栏 图标
                    icons: 'default.png',

                    events: {
                    }
                },

                //编辑内容
                content: {
                    events: {
                    }
                },

                placeholder: {
                    //是否必须
                    required: false,

                    events: {
                    }
                },

                //独占
                exclusive: function (widget) {
                    widget.exclusiveState = true;
                    widget.onClass(true);
                },

                //释放
                release: function (widget) {
                    widget.exclusiveState = false;
                    widget.onClass(false);
                },

                //初始化
                init: function (widget) {
                },

                //注册运行
                run: function (widget) {

                },

                name: ''

            };

            //所属编辑器
            this.seditor = null;

            //自定义属性
            this.custom = {};

            //工具栏
            this.toolbar = {
                //工具栏触发事件
                trigger: {},

                //工具栏元素
                $: null,

                //工具栏事件
                wrapEvents: {

                    click: function (widget, callback) {

                        widget.toolbar.trigger['click'] = function () {
                            widget.toolbar.$.trigger('click');
                        }

                        widget.toolbar.$.click(function () {
                            //防止重复触发
                            if (!widget.exclusiveState) {
                                //独占
                                widget.definition.exclusive(widget);

                                callback(widget);

                                //解除
                                widget.definition.release(widget);
                            }
                        });

                    }
                }
            };

            //内容
            this.content = {
                //编辑内容事件
                wrapEvents: {
                    click: function (widget, callback) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]').click(function () {
                            var identity;
                            widget.$element = $(this);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            return callback(widget);
                        });
                    },

                    dblclick: function (widget, callback) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]').dblclick(function () {
                            var identity;
                            widget.$element = $(this);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            return callback(widget);
                        });
                    },

                    //JQuery-UI 排序
                    sortable: function (widget, config) {
                        config['items'] = '[' + widget.marker + '="' + widget.id + '"]';
                        return widget.seditor.element.$.sortable(config);
                    },

                    mousedown: function (widget, callback) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]').mousedown(function () {
                            var identity;
                            widget.$element = $(this);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            return callback(widget);
                        });
                    },
                    mouseup: function (widget, callback) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]').mouseup(function () {
                            var identity;
                            widget.$element = $(this);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            return callback(widget);
                        });
                    },
                    mouseover: function (widget, callback) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]').mouseover(function () {
                            var identity;
                            widget.$element = $(this);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            return callback(widget);
                        });
                    },
                    mousemove: function (widget, callbck) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]').mousemove(function (event) {
                            var identity;
                            widget.$element = $(this);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            return callback(widget);
                        });
                    }
                }
            };

            //编辑区
            this.placeholder = {
                //元素
                html: '<div class="widget-holder" style="position: relative;cursor:pointer;"><span style="position: absolute; z-index: 9999; display: block; width: 80px; height: 30px; background: rgb(38, 38, 38); right: 0; top: 0; opacity: 0.9; text-align: center; line-height: 30px; color: rgb(255, 0, 0); font-weight: bold; font-size: 14px; border: 1px solid rgb(172, 172, 172);">编辑</span></div>',

                $: null,

                //事件
                wrapEvents: {

                    click: function (widget, callback) {
                        widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]>.widget-holder').click(function (event) {
                            var identity;
                            widget.$element = $($(this).parents('[' + widget.marker + '="' + widget.id + '"]')[0]);
                            identity = widget.$element.attr('identity-toggle');
                            if (identity) {
                                widget.$copyElement = widget.findCopyElement(widget.marker, widget.id, identity);
                            }
                            widget.placeholder.$ = $(this);
                            return callback(widget);
                        });
                    }
                }
            };

            //部件唯一标识
            this.id;

            //当前元素
            this.$element = null;

            //复制当前元素
            this.$copyElement = null;

            //独占状态
            this.exclusiveState = false;

            //点击样式
            this.onClass = function (is) {
                /*                if (is) {
                 this.toolbar.$.addClass('sed_button_on');
                 } else {
                 this.toolbar.$.removeClass('sed_button_on');
                 }*/
            };

            //基路径
            this.basePath = function () {
                return SEDITOR.plugins.basePath + this.id + '/';
            };


            //查找复制元素
            this.findCopyElement = function (marker, id, identity) {
                return $(this.seditor.copyElement.$.find('[' + marker + '="' + id + '"][identity-toggle="' + identity + '"]')[0]);
            };

            //默认图标
            this.icons = function () {
                return this.id;
            };

            //初始化
            this.init = function () {
                this.createPlaceholder();

                this.definition.init(this);

                this.createIdentity();
            };

            this.run = function () {
                //初始化工具栏
                SEDITOR.toolbar.create(this);

                this.definition.run(this);
            };

            this.createPlaceholder = function () {
                if (this.definition.placeholder.required) {
                    var widget = this, $instances = widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]'),
                        $instance;

                    $($instances).each(function () {
                        $instance = $(this);
                        var $childs = $instance.children();
                        if ($childs.length > 0) {
                            $($childs[0]).before(widget.placeholder.html);
                        } else {
                            $instance.append(widget.placeholder.html);
                        }
                    });
                }
            };

            //创建唯一标识
            this.createIdentity = function () {
                var widget = this, $instances = widget.seditor.element.$.find('[' + widget.marker + '="' + widget.id + '"]'),
                    $instance;
                $instances.each(function (index) {
                    $instance = $(this);
                    $instance.attr('identity-toggle', index);
                });

                $instances = widget.seditor.copyElement.$.find('[' + widget.marker + '="' + widget.id + '"]');
                $instances.each(function (index) {
                    $instance = $(this);
                    $instance.attr('identity-toggle', index);
                });

            }


            //部件标志符
            this.marker = 'widget-toggle';

        }
    };

    //工具栏
    SEDITOR.toolbar = {
        html: {
            main: '<a  class="sed_button"></a>',
            name: '<span class="sed_button_name"></span>',
            icon: '<span class="sed_button_icon"></span>'
        },

        //创建部件工具栏
        create: function (widget) {
            if (widget.definition.toolbar.required) {
                var $main = widget.toolbar.$ = $(this.html.main),
                    $icons;


                //标识
                $main.attr('widget-toggle', widget.id);

                if ($.trim(widget.definition.toolbar.title)) {
                    $main.attr('title', widget.definition.toolbar.title);
                }

                //图标
                if ($.trim(widget.icons()) != '') {
                    $icons = $(this.html.icon).css({
                        'background-image': 'url(' + widget.basePath() + 'icons/' + widget.id + '.png)',
                        'background-position': '0 0px',
                        'background-size': '16px'
                    });
                    $main.append($icons);
                } else {
                    //默认图标
                    $icons = $(this.html.icon).css({
                        'background-image': 'url(' + SEDITOR.plugins.basePath + 'default.png)',
                        'background-position': '0 0px',
                        'background-size': '16px'
                    })
                    $main.append($icons);
                }

                //显示名称
                if ($.trim(widget.definition.name) != '') {
                    $main.append($(this.html.name).html(widget.definition.name));
                }

                widget.seditor.$dest.find('.sed_top').append($main);

                //渲染
                this.bindEvents(widget);
            }
        },

        //绑定事件
        bindEvents: function (widget) {
            if (typeof widget.definition.toolbar.events !== 'undefined' && widget.definition.toolbar.events != null) {
                for (key in  widget.definition.toolbar.events) {
                    typeof widget.toolbar.wrapEvents[key] !== 'undefined'
                    && widget.toolbar.wrapEvents[key](widget, widget.definition.toolbar.events[key]);
                }
            }
        }


    };


    /**
     * 工具集
     */
    SEDITOR.tools = {
        widget: {

            /**
             * 查找部件属性
             * Tips 嵌套部件时，内部部件的属性不属于外部部件属性
             * Params
             *  - $belongElement 归属父类元素
             *  - markers 有效归属父类标记
             *  - $dataElement 目标属性依附元素
             *
             * Returns
             *  - true 存在此属性
             *  - false 不存在此属性
             */
            hasAttr: function ($belongElement, markers, $dataElement) {

                var selector = '', isExist = false, $parents;

                //依附元素即是归属父类元素，返回true
                if ($dataElement[0] === $belongElement[0]) return isExist = true;

                $(markers).each(function () {
                    selector += '[' + this + '],';
                });
                selector = selector.substring(0, selector.length - 1);
                $parents = $dataElement.parents(selector);
                if ($parents.length > 0) {
                    if ($parents[0] === $belongElement[0]) isExist = true;
                }

                return isExist;
            },

            /*
             * Todo 元素切换样式
             * Params
             *  - elementClass 元素的类样式,type String
             *  - classArray 功能样式组, type Array
             *  - newClass 当前要切换样式, type String
             *
             *  Returns
             *  - classStr 元素最终类样式
             */
            replaceClass: function (elementClass, classArray, newClass) {
                var _class = '', classStr = '', include = false;
                if (elementClass) {

                    //遍历类样式
                    $(elementClass.split(' ')).each(function () {
                        _class = this;
                        if (_class) {

                            //移除类样式中出现在功能样式中的样式
                            $(classArray).each(function () {
                                if (_class.toString() === this.toString()) {
                                    include = true;
                                    return;
                                }
                            });
                            if (!include) {
                                classStr += (' ' + _class);
                            }
                        }
                    });
                    return classStr += (' ' + newClass);
                } else {
                    return classStr = newClass;
                }
            }
        },

        /*
         * Todo 数组操作
         */
        array: {

            /**
             * Todo 数组添加数组或字符串
             *
             * Params
             *  - source 用来扩展dest的数组或字符串
             *  - dest 待扩展的数组
             */
            append: function (source, dest) {
                $(source).each(function () {
                    dest.push(this);
                });
            }
        },

        /**
         * Todo 在指定元素($element)  下且包括该元素，查找包含指定属性 (attrLabel) 的所有元素
         * Params
         *  - $element 待查找元素
         *  - 属性标签
         *
         *  Returns
         *   - $elements 所有包含指定属性的元素
         */
        findElements: function ($element, attrLabel) {
            var $elements = [];
            $elements = $element.find('[' + attrLabel + ']');
            if (!(typeof $element.attr(attrLabel) === 'undefined')) {
                $elements.push($element)
            }

            return $elements;
        }

    };

    (function () {

        //尝试获取$
        if (typeof($) !== 'undefined') {
            //设置钩子
            var handleId = setInterval(function () {
                if (typeof($) != 'undefined') {

                    //检测当前文档类标签
                    //在文档加载完成之后操作
                    $(function () {
                        //加载配置
                        SEDITOR.loadConfig();

                        //加载样式
                        SEDITOR.loadSkins();

                        //检测当前文档类标签
                        SEDITOR.detect.byClass();
                    });


                    //清除钩子
                    clearInterval(handleId);
                }
            }, 100);
        } else {

            //在文档加载完成之后操作
            $(function () {
                //加载配置
                SEDITOR.loadConfig();

                //加载样式
                SEDITOR.loadSkins();

                //检测当前文档类标签
                SEDITOR.detect.byClass();
            });
        }

    })();
})();
