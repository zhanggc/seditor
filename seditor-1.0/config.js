/**
 * Created by zhanggc on 2015/3/29.
 */
SEDITOR.setConfig = function( config ) {

    //加载插件
    config.plugins = ['sources','image','upload','link','preview','zoom','swapping','product','actProduct','suit','suitPro'];

    config.neededScripts['jquery']['path'] = '../jquery/jquery-1.4.4.js';
    config.neededScripts['jquery-ui']['path'] = '../jquery/ui/jquery-ui.js';
};