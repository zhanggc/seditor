/*
 * jQuery UI Draggable 1.8.7
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Draggables
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.mouse.js
 *	jquery.ui.widget.js
 */
(function( $, undefined ) {

    $.widget("ui.draggable", $.ui.mouse, {
        widgetEventPrefix: "drag",
        options: {
            addClasses: true,
            appendTo: "parent",
            axis: false,
            connectToSortable: false,
            containment: false,
            cursor: "auto",
            cursorAt: false,
            grid: false,
            handle: false,
            helper: "original",
            iframeFix: false,
            opacity: false,
            refreshPositions: false,
            revert: false,
            revertDuration: 500,
            scope: "default",
            scroll: true,
            scrollSensitivity: 20,
            scrollSpeed: 20,
            snap: false,
            snapMode: "both",
            snapTolerance: 20,
            stack: false,
            zIndex: false
        },
        _create: function() {

            if (this.options.helper == 'original' && !(/^(?:r|a|f)/).test(this.element.css("position")))
                this.element[0].style.position = 'relative';

            (this.options.addClasses && this.element.addClass("ui-draggable"));
            (this.options.disabled && this.element.addClass("ui-draggable-disabled"));

            this._mouseInit();

        },

        destroy: function() {
            if(!this.element.data('draggable')) return;
            this.element
                .removeData("draggable")
                .unbind(".draggable")
                .removeClass("ui-draggable"
                    + " ui-draggable-dragging"
                    + " ui-draggable-disabled");
            this._mouseDestroy();

            return this;
        },

        _mouseCapture: function(event) {

            var o = this.options;

            // among others, prevent a drag on a resizable-handle
            if (this.helper || o.disabled || $(event.target).is('.ui-resizable-handle'))
                return false;

            //Quit if we're not on a valid handle
            this.handle = this._getHandle(event);
            if (!this.handle)
                return false;

            return true;

        },

        _mouseStart: function(event) {

            var o = this.options;

            //Create and append the visible helper
            this.helper = this._createHelper(event);

            //Cache the helper size
            this._cacheHelperProportions();

            //If ddmanager is used for droppables, set the global draggable
            if($.ui.ddmanager)
                $.ui.ddmanager.current = this;

            /*
             * - Position generation -
             * This block generates everything position related - it's the core of draggables.
             */

            //Cache the margins of the original element
            this._cacheMargins();

            //Store the helper's css position
            this.cssPosition = this.helper.css("position");
            this.scrollParent = this.helper.scrollParent();

            //The element's absolute position on the page minus margins
            this.offset = this.positionAbs = this.element.offset();
            this.offset = {
                top: this.offset.top - this.margins.top,
                left: this.offset.left - this.margins.left
            };

            $.extend(this.offset, {
                click: { //Where the click happened, relative to the element
                    left: event.pageX - this.offset.left,
                    top: event.pageY - this.offset.top
                },
                parent: this._getParentOffset(),
                relative: this._getRelativeOffset() //This is a relative to absolute position minus the actual position calculation - only used for relative positioned helper
            });

            //Generate the original position
            this.originalPosition = this.position = this._generatePosition(event);
            this.originalPageX = event.pageX;
            this.originalPageY = event.pageY;

            //Adjust the mouse offset relative to the helper if 'cursorAt' is supplied
            (o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt));

            //Set a containment if given in the options
            if(o.containment)
                this._setContainment();

            //Trigger event + callbacks
            if(this._trigger("start", event) === false) {
                this._clear();
                return false;
            }

            //Recache the helper size
            this._cacheHelperProportions();

            //Prepare the droppable offsets
            if ($.ui.ddmanager && !o.dropBehaviour)
                $.ui.ddmanager.prepareOffsets(this, event);

            this.helper.addClass("ui-draggable-dragging");
            this._mouseDrag(event, true); //Execute the drag once - this causes the helper not to be visible before getting its correct position
            return true;
        },

        _mouseDrag: function(event, noPropagation) {

            //Compute the helpers position
            this.position = this._generatePosition(event);
            this.positionAbs = this._convertPositionTo("absolute");

            //Call plugins and callbacks and use the resulting position if something is returned
            if (!noPropagation) {
                var ui = this._uiHash();
                if(this._trigger('drag', event, ui) === false) {
                    this._mouseUp({});
                    return false;
                }
                this.position = ui.position;
            }

            if(!this.options.axis || this.options.axis != "y") this.helper[0].style.left = this.position.left+'px';
            if(!this.options.axis || this.options.axis != "x") this.helper[0].style.top = this.position.top+'px';
            if($.ui.ddmanager) $.ui.ddmanager.drag(this, event);

            return false;
        },

        _mouseStop: function(event) {

            //If we are using droppables, inform the manager about the drop
            var dropped = false;
            if ($.ui.ddmanager && !this.options.dropBehaviour)
                dropped = $.ui.ddmanager.drop(this, event);

            //if a drop comes from outside (a sortable)
            if(this.dropped) {
                dropped = this.dropped;
                this.dropped = false;
            }

            //if the original element is removed, don't bother to continue
            if(!this.element[0] || !this.element[0].parentNode)
                return false;

            if((this.options.revert == "invalid" && !dropped) || (this.options.revert == "valid" && dropped) || this.options.revert === true || ($.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped))) {
                var self = this;
                $(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function() {
                    if(self._trigger("stop", event) !== false) {
                        self._clear();
                    }
                });
            } else {
                if(this._trigger("stop", event) !== false) {
                    this._clear();
                }
            }

            return false;
        },

        cancel: function() {

            if(this.helper.is(".ui-draggable-dragging")) {
                this._mouseUp({});
            } else {
                this._clear();
            }

            return this;

        },

        _getHandle: function(event) {

            var handle = !this.options.handle || !$(this.options.handle, this.element).length ? true : false;
            $(this.options.handle, this.element)
                .find("*")
                .andSelf()
                .each(function() {
                    if(this == event.target) handle = true;
                });

            return handle;

        },

        _createHelper: function(event) {

            var o = this.options;
            var helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [event])) : (o.helper == 'clone' ? this.element.clone() : this.element);

            if(!helper.parents('body').length)
                helper.appendTo((o.appendTo == 'parent' ? this.element[0].parentNode : o.appendTo));

            if(helper[0] != this.element[0] && !(/(fixed|absolute)/).test(helper.css("position")))
                helper.css("position", "absolute");

            return helper;

        },

        _adjustOffsetFromHelper: function(obj) {
            if (typeof obj == 'string') {
                obj = obj.split(' ');
            }
            if ($.isArray(obj)) {
                obj = {left: +obj[0], top: +obj[1] || 0};
            }
            if ('left' in obj) {
                this.offset.click.left = obj.left + this.margins.left;
            }
            if ('right' in obj) {
                this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
            }
            if ('top' in obj) {
                this.offset.click.top = obj.top + this.margins.top;
            }
            if ('bottom' in obj) {
                this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
            }
        },

        _getParentOffset: function() {

            //Get the offsetParent and cache its position
            this.offsetParent = this.helper.offsetParent();
            var po = this.offsetParent.offset();

            // This is a special case where we need to modify a offset calculated on start, since the following happened:
            // 1. The position of the helper is absolute, so it's position is calculated based on the next positioned parent
            // 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't the document, which means that
            //    the scroll is included in the initial calculation of the offset of the parent, and never recalculated upon drag
            if(this.cssPosition == 'absolute' && this.scrollParent[0] != document && $.ui.contains(this.scrollParent[0], this.offsetParent[0])) {
                po.left += this.scrollParent.scrollLeft();
                po.top += this.scrollParent.scrollTop();
            }

            if((this.offsetParent[0] == document.body) //This needs to be actually done for all browsers, since pageX/pageY includes this information
                || (this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == 'html' && $.browser.msie)) //Ugly IE fix
                po = { top: 0, left: 0 };

            return {
                top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"),10) || 0),
                left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"),10) || 0)
            };

        },

        _getRelativeOffset: function() {

            if(this.cssPosition == "relative") {
                var p = this.element.position();
                return {
                    top: p.top - (parseInt(this.helper.css("top"),10) || 0) + this.scrollParent.scrollTop(),
                    left: p.left - (parseInt(this.helper.css("left"),10) || 0) + this.scrollParent.scrollLeft()
                };
            } else {
                return { top: 0, left: 0 };
            }

        },

        _cacheMargins: function() {
            this.margins = {
                left: (parseInt(this.element.css("marginLeft"),10) || 0),
                top: (parseInt(this.element.css("marginTop"),10) || 0)
            };
        },

        _cacheHelperProportions: function() {
            this.helperProportions = {
                width: this.helper.outerWidth(),
                height: this.helper.outerHeight()
            };
        },

        _setContainment: function() {

            var o = this.options;
            if(o.containment == 'parent') o.containment = this.helper[0].parentNode;
            if(o.containment == 'document' || o.containment == 'window') this.containment = [
                    (o.containment == 'document' ? 0 : $(window).scrollLeft()) - this.offset.relative.left - this.offset.parent.left,
                    (o.containment == 'document' ? 0 : $(window).scrollTop()) - this.offset.relative.top - this.offset.parent.top,
                    (o.containment == 'document' ? 0 : $(window).scrollLeft()) + $(o.containment == 'document' ? document : window).width() - this.helperProportions.width - this.margins.left,
                    (o.containment == 'document' ? 0 : $(window).scrollTop()) + ($(o.containment == 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top
            ];

            if(!(/^(document|window|parent)$/).test(o.containment) && o.containment.constructor != Array) {
                var ce = $(o.containment)[0]; if(!ce) return;
                var co = $(o.containment).offset();
                var over = ($(ce).css("overflow") != 'hidden');

                this.containment = [
                        co.left + (parseInt($(ce).css("borderLeftWidth"),10) || 0) + (parseInt($(ce).css("paddingLeft"),10) || 0) - this.margins.left,
                        co.top + (parseInt($(ce).css("borderTopWidth"),10) || 0) + (parseInt($(ce).css("paddingTop"),10) || 0) - this.margins.top,
                        co.left+(over ? Math.max(ce.scrollWidth,ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css("borderLeftWidth"),10) || 0) - (parseInt($(ce).css("paddingRight"),10) || 0) - this.helperProportions.width - this.margins.left,
                        co.top+(over ? Math.max(ce.scrollHeight,ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css("borderTopWidth"),10) || 0) - (parseInt($(ce).css("paddingBottom"),10) || 0) - this.helperProportions.height - this.margins.top
                ];
            } else if(o.containment.constructor == Array) {
                this.containment = o.containment;
            }

        },

        _convertPositionTo: function(d, pos) {

            if(!pos) pos = this.position;
            var mod = d == "absolute" ? 1 : -1;
            var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.ui.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

            return {
                top: (
                    pos.top																	// The absolute mouse position
                    + this.offset.relative.top * mod										// Only for relative positioned nodes: Relative offset from element to offset parent
                    + this.offset.parent.top * mod											// The offsetParent's offset without borders (offset + border)
                    - ($.browser.safari && $.browser.version < 526 && this.cssPosition == 'fixed' ? 0 : ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) * mod)
                    ),
                left: (
                    pos.left																// The absolute mouse position
                    + this.offset.relative.left * mod										// Only for relative positioned nodes: Relative offset from element to offset parent
                    + this.offset.parent.left * mod											// The offsetParent's offset without borders (offset + border)
                    - ($.browser.safari && $.browser.version < 526 && this.cssPosition == 'fixed' ? 0 : ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ) * mod)
                    )
            };

        },

        _generatePosition: function(event) {

            var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.ui.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);
            var pageX = event.pageX;
            var pageY = event.pageY;

            /*
             * - Position constraining -
             * Constrain the position to a mix of grid, containment.
             */

            if(this.originalPosition) { //If we are not dragging yet, we won't check for options

                if(this.containment) {
                    if(event.pageX - this.offset.click.left < this.containment[0]) pageX = this.containment[0] + this.offset.click.left;
                    if(event.pageY - this.offset.click.top < this.containment[1]) pageY = this.containment[1] + this.offset.click.top;
                    if(event.pageX - this.offset.click.left > this.containment[2]) pageX = this.containment[2] + this.offset.click.left;
                    if(event.pageY - this.offset.click.top > this.containment[3]) pageY = this.containment[3] + this.offset.click.top;
                }

                if(o.grid) {
                    var top = this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1];
                    pageY = this.containment ? (!(top - this.offset.click.top < this.containment[1] || top - this.offset.click.top > this.containment[3]) ? top : (!(top - this.offset.click.top < this.containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

                    var left = this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0];
                    pageX = this.containment ? (!(left - this.offset.click.left < this.containment[0] || left - this.offset.click.left > this.containment[2]) ? left : (!(left - this.offset.click.left < this.containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
                }

            }

            return {
                top: (
                    pageY																// The absolute mouse position
                    - this.offset.click.top													// Click offset (relative to the element)
                    - this.offset.relative.top												// Only for relative positioned nodes: Relative offset from element to offset parent
                    - this.offset.parent.top												// The offsetParent's offset without borders (offset + border)
                    + ($.browser.safari && $.browser.version < 526 && this.cssPosition == 'fixed' ? 0 : ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ))
                    ),
                left: (
                    pageX																// The absolute mouse position
                    - this.offset.click.left												// Click offset (relative to the element)
                    - this.offset.relative.left												// Only for relative positioned nodes: Relative offset from element to offset parent
                    - this.offset.parent.left												// The offsetParent's offset without borders (offset + border)
                    + ($.browser.safari && $.browser.version < 526 && this.cssPosition == 'fixed' ? 0 : ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ))
                    )
            };

        },

        _clear: function() {
            this.helper.removeClass("ui-draggable-dragging");
            if(this.helper[0] != this.element[0] && !this.cancelHelperRemoval) this.helper.remove();
            //if($.ui.ddmanager) $.ui.ddmanager.current = null;
            this.helper = null;
            this.cancelHelperRemoval = false;
        },

        // From now on bulk stuff - mainly helpers

        _trigger: function(type, event, ui) {
            ui = ui || this._uiHash();
            $.ui.plugin.call(this, type, [event, ui]);
            if(type == "drag") this.positionAbs = this._convertPositionTo("absolute"); //The absolute position has to be recalculated after plugins
            return $.Widget.prototype._trigger.call(this, type, event, ui);
        },

        plugins: {},

        _uiHash: function(event) {
            return {
                helper: this.helper,
                position: this.position,
                originalPosition: this.originalPosition,
                offset: this.positionAbs
            };
        }

    });

    $.extend($.ui.draggable, {
        version: "1.8.7"
    });