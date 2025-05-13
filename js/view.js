/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * BxTimelineView constructor.
 * Initializes the Timeline View object with provided options.
 * @param {object} oOptions - Configuration options for the Timeline View.
 */
function BxTimelineView(oOptions) {
    BxTimelineMain.call(this, oOptions);

    this._sActionsUri = oOptions.sActionUri;
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oTimelineView' : oOptions.sObjName;
    this._sObjNameMenuFeeds = oOptions.sObjNameMenuFeeds == undefined ? 'bx_timeline_menu_feeds' : oOptions.sObjNameMenuFeeds;
    this._sName = oOptions.sName == undefined ? '' : oOptions.sName;
    this._sView = oOptions.sView == undefined ? 'timeline' : oOptions.sView;
    this._sType = oOptions.sType == undefined ? 'public' : oOptions.sType;
    this._iOwnerId = oOptions.iOwnerId == undefined ? 0 : oOptions.iOwnerId;
    this._sReferrer = oOptions.sReferrer == undefined ? '' : oOptions.sReferrer;
    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this._sVideosAutoplay = oOptions.sVideosAutoplay == undefined ? 'off' : oOptions.sVideosAutoplay;
    this._bEventsToLoad = oOptions.bEventsToLoad == undefined ? false : oOptions.bEventsToLoad;
    this._bAutoMarkAsViewed = oOptions.bAutoMarkAsViewed == undefined ? false : oOptions.bAutoMarkAsViewed;
    this._aMarkAsViewed = oOptions.aMarkAsViewed == undefined ? [] : oOptions.aMarkAsViewed;
    this._aMarkedAsViewed = oOptions.aMarkedAsViewed == undefined ? [] : oOptions.aMarkedAsViewed;
    this._iLimitAttachLinks = oOptions.iLimitAttachLinks == undefined ? 0 : oOptions.iLimitAttachLinks;
    this._sLimitAttachLinksErr = oOptions.sLimitAttachLinksErr == undefined ? '' : oOptions.sLimitAttachLinksErr;
    this._oAttachedLinks = oOptions.oAttachedLinks == undefined ? {} : oOptions.oAttachedLinks;
    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;

    this._bInfScroll = oOptions.bInfScroll == undefined ? false : oOptions.bInfScroll;
    this._iInfScrollAutoPreloads = oOptions.iInfScrollAutoPreloads == undefined ? 10 : oOptions.iInfScrollAutoPreloads;
    this._sInfScrollAfter = 'item';
    this._iInfScrollAfterItem = 2; //--- Preload more info when scroll reached N item from the end of Timeline block.
    this._fInfScrollAfterPercent = 0.25; //--- Preload more info when specified portion of Timeline block's content was already scrolled.
    this._bInfScrollBusy = false;
    this._iInfScrollPreloads = 1; //--- First portion is loaded with page loading or 'Load More' button click.

    this._fOutsideOffset = 0.8;
    this._oSaved = {};

    this._fVapOffsetStart = 0.8;
    this._fVapOffsetStop = 0.2;

    this._bLiveUpdatePaused = false;

    this._oFiltersPopupOptions = {};

    if(typeof window.glBxTimelineVapPlayers === 'undefined')
        window.glBxTimelineVapPlayers = [];

    //--- Use Scroll for Attachments.
    this._bScrollForFiles = true;

    this._bAutoMarkBusy = false;
    
    //--- Get currently active 'view'.
    this.initView();

    //--- Initialize components on currently active 'view'.
    this.init();
}

BxTimelineView.prototype = Object.create(BxTimelineMain.prototype);
BxTimelineView.prototype.constructor = BxTimelineView;

/**
 * Initializes the Timeline View and its components.
 * @param {boolean} bForceInit - Whether to force re-initialization.
 */
BxTimelineView.prototype.init = function(bForceInit)
{
    var $this = this;

    if(!this.oView || bForceInit)
        this.initView();

    if(this.bViewTimeline) {
        //-- Check content to show 'See More'
        this.initSeeMore(this.oView, true);

        //--- Init Video Autoplay
        if(this._sVideosAutoplay != 'off') {
            this.initVideosAutoplay(this.oView);

            this.oView.on('hide')

            $(window).on('scroll', function() {
                if(!$this.oView.is(':visible'))
                    return;

                if(!window.requestAnimationFrame) 
                    setTimeout(function() {
                        $this.autoplayVideos($this.oView, $this._fVapOffsetStart, $this._fVapOffsetStop);
                    }, 100);
                else
                    window.requestAnimationFrame(function() {
                        $this.autoplayVideos($this.oView, $this._fVapOffsetStart, $this._fVapOffsetStop);
                    });
            });
        }

        //--- Blink (highlight) necessary items
        this.blink(this.oView);

        //--- Load 'Jump To'
        this.initJumpTo(this.oView);

        //--- Init 'Infinite Scroll'
        this.initInfiniteScroll(this.oView);

        //--- Init calendar
        this.initCalendar();

        //--- Init mark as viewed
        if(this._bAutoMarkAsViewed) {
            $(window).on('load scroll', function() {
                if(!$this.oView.is(':visible'))
                    return;

                if(!window.requestAnimationFrame) 
                    setTimeout(function() {
                        $this.markPostAsViewed($this.oView);
                    }, 100);
                else
                    window.requestAnimationFrame(function() {
                        $this.markPostAsViewed($this.oView);
                    });
            });

            window.addEventListener('beforeunload', (event) => {
                $this.sendMarkPostAsViewed();
            });
        }
    }

    if(this.bViewOutline) {
        this.initMasonry();

        this.oView.find('.' + this.sClassItem).resize(function() {
            $this.reloadMasonry();
        });
        this.oView.find('img.' + this.sClassItemImage).load(function() {
            $this.reloadMasonry();
        });

        //--- Init Video Layout
        if(this._sVideosAutoplay != 'off')
            this.initVideos(this.oView);

        //--- Blink (highlight) necessary items
        this.blink(this.oView);

        //--- Load 'Jump To'
        this.initJumpTo(this.oView);

        //--- Init 'Infinite Scroll'
        this.initInfiniteScroll(this.oView);
    }

    if(this.bViewItem) {
        //-- Check content to show 'See More'
        this.initSeeMore(this.oView, false);

        //--- Init Video Layout
        if(this._sVideosAutoplay != 'off')
            this.initVideos(this.oView);
    }

    //--- Init Flickity
    this.initFlickity(this.oView);
};

/**
 * Initializes the current view and sets view type flags.
 */
BxTimelineView.prototype.initView = function() 
{   
    BxTimelineMain.prototype.initView.call(this);

    this.oView = $(this._getHtmlId('main', this._oRequestParams));
    if(!this.oView.length) 
        return;

    if(this.oView.hasClass(this.sClassView + '-timeline'))
        this.bViewTimeline = true;
    else if(this.oView.hasClass(this.sClassView + '-outline'))
        this.bViewOutline = true;
    else if(this.oView.hasClass(this.sClassView + '-item'))
        this.bViewItem = true;
};

/**
 * Initializes the "See More" functionality for overflowing content.
 * @param {jQuery} oParent - Parent element to search for content.
 * @param {boolean} bInItems - Whether to search inside items.
 */
BxTimelineView.prototype.initSeeMore = function(oParent, bInItems)
{
    var $this = this;

    var oSubParent = oParent;
    if(bInItems)
        oSubParent = oParent.find('.' + this.sClassItem);

    oSubParent.find('.bx-tl-item-text .bx-tl-content').bxCheckOverflowHeight(this.sSP + '-overflow', function(oElement) {
        $this.onFindOverflow(oElement);
    });

    if(oSubParent.find('.bx-tl-item-text .bx-tl-content .bx-embed-link').length != 0)
        setTimeout(function() {
            oSubParent.find('.bx-tl-item-text .bx-tl-content:not(.' +  $this.sSP + '-overflow)').has('.bx-embed-link').bxCheckOverflowHeight($this.sSP + '-overflow', function(oElement) {
                $this.onFindOverflow(oElement);
            });
        }, 4000);
};

/**
 * Loads the "Jump To" navigation for the timeline.
 * @param {jQuery} oParent - Parent element to append the jump-to menu.
 */
BxTimelineView.prototype.initJumpTo = function(oParent)
{
    var oJumpTo = $(oParent).find('.' + this.sClassJumpTo);
    if(!oJumpTo || oJumpTo.length == 0 || oJumpTo.html() != '')
        return;

    bx_loading_btn(oJumpTo, true);

    jQuery.post (
        this._sActionsUrl + 'get_jump_to/',
        this._getDefaultData(oParent),
        function(oData) {
            oData.holder = oJumpTo;

            processJsonData(oData);
        },
        'json'
    );
};

/**
 * Callback for handling the loaded "Jump To" content.
 * @param {object} oData - Data containing the jump-to content.
 */
BxTimelineView.prototype.onGetJumpTo = function(oData)
{
    if(!oData.holder || oData.content == undefined)
        return;

    $(oData.holder).html(oData.content);
};

/**
 * Initializes infinite scroll for loading more timeline events.
 * @param {jQuery} oParent - Parent element containing timeline items.
 */
BxTimelineView.prototype.initInfiniteScroll = function(oParent)
{
    var $this = this;

    if(!this._bInfScroll || !this._bEventsToLoad)
        return;

    // Debounced scroll handler
    var onScroll = debounce(function(oEvent) {
        if(!$this.oView.is(':visible'))
            return;

        if($this.oView.attr('id') != $this._getHtmlId('main', {name: $this._sName, view: $this._sView, type: $this._sType}, {hash: false}))
            return;

        if(!$this._bEventsToLoad || $this._bInfScrollBusy || $this._iInfScrollPreloads >= $this._iInfScrollAutoPreloads)
            return;

        var iScrollTop = parseInt($(window).scrollTop());
        var iWindowHeight = $(window).height();

        //--- Auto-scroll by reaching the N item from the end of parent block.
        if($this._sInfScrollAfter == 'item') {
            var oItems = oParent.find('.' + $this.sClassItem);
            if((iScrollTop + iWindowHeight) <= ($(oItems.get(oItems.length - $this._iInfScrollAfterItem)).offset().top))
                return;
        }

        //--- Auto-scroll by reaching the percent of parent block's height.
        if($this._sInfScrollAfter == 'percent') {
            var iParentTop = parseInt(oParent.offset().top);
            var iParentHeight = parseInt(oParent.height());
            if((iScrollTop + iWindowHeight) <= (iParentTop + iParentHeight * $this._fInfScrollAfterPercent))
                return;
        }

        var iStart = $this._oRequestParams.start + ($this._oRequestParams.start == 0 ? $this._oRequestParams.per_page_default : $this._oRequestParams.per_page);

        $this._bInfScrollBusy = true;
        $this._getPage(undefined, iStart, $this._oRequestParams.per_page, function(oData) {
            $this._bEventsToLoad = oData.events_to_load;
            $this._iInfScrollPreloads += 1;
            $this._bInfScrollBusy = false;
        });
    }, 100);

    $(window).bind('scroll', onScroll);
};

/**
 * Initialize autoplay functionality for video iframes.
 * Registers iframe players and enforces single-session playback: only one video plays at a time.
 * Uses IntersectionObserver for visibility detection if available, otherwise falls back to scroll-based logic.
 * 
 * @param {jQuery} oParent - jQuery object containing the parent element for video iframes.
 */
BxTimelineView.prototype.initVideosAutoplay = function(oParent) {
    var $this = this;

    if (this._sVideosAutoplay === 'off') return;

    // Preserve original initialization
    this.initVideos(oParent);

    var sPrefix = oParent.hasClass(this.sClassView)
        ? oParent.attr('id')
        : oParent.parents('.' + this.sClassView + ':first').attr('id');

    // Register each iframe player once, without deleting existing references
    oParent.find('iframe[id]').each(function() {
        var frame = this;
        var key = sPrefix + '_' + frame.id;

        // If the player already exists, skip reinitialization
        if (window.glBxTimelineVapPlayers[key]) {
            console.log(`Player ${key} already exists. Skipping reinitialization.`);
            return;
        }

        // Initialize the new player
        var player = new playerjs.Player(frame);
        if ($this._sVideosAutoplay === 'on_mute') player.mute();

        // Sync container height on ready/play
        var fFixHeight = function() {
            var video = $('#' + key).contents().find('video');
            if (video.length) $('#' + key).height(video.height() + 'px');
        };
        player.on('ready', fFixHeight);
        player.on('play', fFixHeight);

        // When this player starts, pause all others
        player.on('play', function() {
            for (var k in window.glBxTimelineVapPlayers) {
                if (k !== key) {
                    try {
                        window.glBxTimelineVapPlayers[k].pause();
                    } catch (e) {
                        console.warn(`Unable to pause player ${k}`, e);
                    }
                }
            }
        });

        // Save the new player
        window.glBxTimelineVapPlayers[key] = player;
    });

    // Reset current session tracking
    this._sCurrentPlayerKey = null;

    // Use IntersectionObserver if available
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(
            function(entries) {
                entries.forEach(function(entry) {
                    var iframe = entry.target;
                    var key = sPrefix + '_' + iframe.id;
                    var player = window.glBxTimelineVapPlayers[key];

                    if (!player) return;

                    if (entry.isIntersecting) {
                        player.play();
                        if ($this._sVideosAutoplay === 'on') {
                            player.unmute();
                        } else if ($this._sVideosAutoplay === 'on_mute') {
                            player.mute();
                        }
                    } else {
                        player.pause();
                    }
                });
            },
            {
                root: null, // Use viewport as root
                rootMargin: '0px',
                threshold: 0.5, // Play when 50% of the video is visible
            }
        );

        oParent.find('iframe[id]').each(function() {
            observer.observe(this);
        });
    } else {
        // Fallback to scroll-based autoplay logic
        $(window)
            .off('scroll.timelineVap')
            .on('scroll.timelineVap', function() {
                if (!$this.oView.is(':visible')) return;

                if (!window.requestAnimationFrame) {
                    setTimeout(function() {
                        $this.autoplayVideosFallback($this.oView, $this._fVapOffsetStart, $this._fVapOffsetStop);
                    }, 100);
                } else {
                    window.requestAnimationFrame(function() {
                        $this.autoplayVideosFallback($this.oView, $this._fVapOffsetStart, $this._fVapOffsetStop);
                    });
                }
            });

        // Trigger fallback autoplay immediately on page load
        if (!window.requestAnimationFrame) {
            setTimeout(function() {
                $this.autoplayVideosFallback($this.oView, $this._fVapOffsetStart, $this._fVapOffsetStop);
            }, 100);
        } else {
            window.requestAnimationFrame(function() {
                $this.autoplayVideosFallback($this.oView, $this._fVapOffsetStart, $this._fVapOffsetStop);
            });
        }
    }
};

/**
 * Autoplay the single most visible video in the viewport.
 * Pauses all other videos before playing the one that is most visible. 
 * This function is triggered on scroll or when the viewport changes.
 * 
 * @param {jQuery} oView - jQuery object containing the video iframes.
 * @param {number} fOffsetStart - Offset from top for start of visible region (as a fraction of window height).
 * @param {number} fOffsetStop - Offset from bottom for stop of visible region (as a fraction of window height).
 */
BxTimelineView.prototype.autoplayVideos = function(oView, fOffsetStart, fOffsetStop) {
    var sPrefix = oView.attr('id') + '_';
    var winTop = $(window).scrollTop();
    var winH = $(window).height();
    var bestKey = null;
    var bestRatio = 0;

    oView.find('.' + this.sClassItem + ' iframe[id]').each(function() {
        var $f = $(this);
        var top = $f.offset().top;
        var bottom = top + $f.height();
        var visTop = Math.max(top, winTop);
        var visBottom = Math.min(bottom, winTop + winH);
        var ratio = Math.max(0, visBottom - visTop) / $f.height();
        var key = sPrefix + this.id;

        if (ratio > bestRatio) {
            bestRatio = ratio;
            bestKey = key;
        }
    });

    // Pause all players before playing the most visible video
    for (var k in window.glBxTimelineVapPlayers) {
        if (k !== bestKey) {
            try {
                window.glBxTimelineVapPlayers[k].pause();
            } catch (e) {
                // Ignore errors
            }
        }
    }

    // Play the best visible video if it's different from the current
    if (bestKey !== this._sCurrentPlayerKey) {
        if (bestKey && window.glBxTimelineVapPlayers[bestKey]) {
            try {
                var player = window.glBxTimelineVapPlayers[bestKey];
                player.play();
                if (this._sVideosAutoplay === 'on') {
                    player.unmute();
                } else if (this._sVideosAutoplay === 'on_mute') {
                    player.mute();
                }
            } catch (e) {
                // Ignore errors
            }
        }
        this._sCurrentPlayerKey = bestKey;
    }
};

/**
 * Manually trigger autoplay logic.
 */
BxTimelineView.prototype.playVideos = function(oView) {
    // Log to track when playVideos is called
    console.log("playVideos called", oView);
    if (this._sVideosAutoplay === 'off') return;
    this.autoplayVideos(oView, this._fVapOffsetStart, this._fVapOffsetStop);
};

/**
 * Immediately pause all videos and reset the current key.
 */
BxTimelineView.prototype.pauseVideos = function(oView) {
    var $this = this;

    if (oView) {
        // Pause videos in the specified view
        var sPrefix = oView.attr('id') + '_';

        oView.find('iframe').each(function() {
            var $iframe = $(this);
            var sPlayerId = sPrefix + $iframe.attr('id');
            var oPlayer = window.glBxTimelineVapPlayers[sPlayerId];
            if (oPlayer) {
                oPlayer.pause();
                oPlayer.mute();
            }
        });
    } else {
        // Pause all videos globally
        for (var k in window.glBxTimelineVapPlayers) {
            try {
                window.glBxTimelineVapPlayers[k].pause();
            } catch (e) {
                // Ignore errors
            }
        }
        this._sCurrentPlayerKey = null;
    }
};

/**
 * Ensure central player logic respects mute/unmute settings.
 */
BxTimelineView.prototype._initCentralVideoObserver = function(aVideoElements) {
    var $this = this;
    var oCurrentlyPlaying = null;

    var observer = new IntersectionObserver(
        function(entries) {
            entries.forEach(function(entry) {
                var oVideoElement = entry.target;
                var sVideoId = oVideoElement.getAttribute('data-bx-timeline-video-id');
                var oVideoData = aVideoElements.find(function(v) {
                    return v.id === sVideoId;
                });

                if (oVideoData) {
                    if (entry.isIntersecting) {
                        if (oCurrentlyPlaying && oCurrentlyPlaying.id !== oVideoData.id) {
                            oCurrentlyPlaying.player.pause();
                        }
                        oVideoData.player.play();
                        oCurrentlyPlaying = oVideoData;

                        if ($this._sVideosAutoplay === 'on') {
                            oVideoData.player.unmute();
                        } else if ($this._sVideosAutoplay === 'on_mute') {
                            oVideoData.player.mute();
                        }

                        $this.playCentralVideo($(entry.target).closest('.timeline-view'));
                    } else {
                        if (oCurrentlyPlaying && oCurrentlyPlaying.id === sVideoId) {
                            oCurrentlyPlaying.player.pause();
                            oCurrentlyPlaying = null;
                        }
                    }
                }
            });
        },
        {
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0,
        }
    );

    aVideoElements.forEach(function(oVideo) {
        observer.observe(oVideo.element);
    });
};


/**
 * Fallback autoplay logic.
 * If IntersectionObserver is not available or disabled, this function plays the video closest to the center of the viewport.
 * 
 * @param {jQuery} oView - jQuery object containing the video iframes.
 * @param {number} fOffsetStart - Offset from top for start of visible region (as a fraction of window height).
 * @param {number} fOffsetStop - Offset from bottom for stop of visible region (as a fraction of window height).
 */
BxTimelineView.prototype.autoplayVideosFallback = function(oView, fOffsetStart, fOffsetStop) {
    var $this = this;

    var oItems = oView.find('.' + this.sClassItem);
    var sPrefix = oView.attr('id') + '_';

    oItems.each(function() {
        $(this).find('iframe').each(function() {
            var oFrame = $(this);
            var sPlayerId = sPrefix + oFrame.attr('id');
            var oPlayer = window.glBxTimelineVapPlayers[sPlayerId];
            if (!oPlayer) {
                return;
            }

            var iFrameTop = oFrame.offset().top;
            var iFrameBottom = iFrameTop + oFrame.height();
            var iWindowTop = $(window).scrollTop();
            var iWindowHeight = $(window).height();
            if (
                iFrameTop <= iWindowTop + iWindowHeight * fOffsetStart &&
                iFrameBottom >= iWindowTop + iWindowHeight * fOffsetStop
            ) {
                oPlayer.play();
            } else {
                oPlayer.pause();
            }
        });
    });
};

/**
 * Manually trigger central-selection playback.
 */
BxTimelineView.prototype.playCentralVideo = function(oView) {
    // Log to track when playCentralVideo is called
    console.log("playCentralVideo called", oView);
    var $this = this;
    var sPrefix = oView.attr('id') + '_';
    var oCentralVideo = this._getCentralVideoInView(oView);

    oView.find('iframe').each(function() {
        var $iframe = $(this);
        var sPlayerId = sPrefix + $iframe.attr('id');
        var oPlayer = window.glBxTimelineVapPlayers[sPlayerId];
        if (oPlayer) {
            oPlayer.pause();
        }
    });

    if (oCentralVideo && oCentralVideo.player) {
        oCentralVideo.player.play();
        if ($this._sVideosAutoplay == 'on') {
            oCentralVideo.player.unmute();
        } else if ($this._sVideosAutoplay == 'on_mute') {
            oCentralVideo.player.mute();
        }
    }
};

/**
 * Get the video element closest to the center of the viewport in the given view.
 * @param {jQuery} oView - jQuery object containing the video iframes.
 * @returns {object|null} - Object with id and player, or null if none found.
 */
BxTimelineView.prototype._getCentralVideoInView = function(oView) {
    var $this = this;
    var oCentralVideo = null;
    var iViewportHeight = $(window).height();
    var iCenterViewport = iViewportHeight / 2;
    var iMinOffset = Infinity;
    var sPrefix = oView.attr('id') + '_';

    oView.find('iframe').each(function() {
        var $iframe = $(this);
        var sPlayerId = sPrefix + $iframe.attr('id');
        var oPlayer = window.glBxTimelineVapPlayers[sPlayerId];
        if (!oPlayer) {
            return;
        }

        var iVideoTop = $iframe.offset().top;
        var iVideoHeight = $iframe.height();
        var iVideoCenter = iVideoTop + (iVideoHeight / 2);
        var iOffset = Math.abs(iVideoCenter - iCenterViewport);

        if (iOffset < iMinOffset) {
            iMinOffset = iOffset;
            oCentralVideo = {
                id: sPlayerId,
                player: oPlayer
            };
        }
    });
    return oCentralVideo;
};

/**
 * Reloads the timeline view, fetching posts again.
 * @param {object} oSource - Source element for loading indication.
 * @param {function} onLoad - Callback to execute after reload.
 */
BxTimelineView.prototype.reload = function(oSource, onLoad)
{
    var $this = this;

    this.loadingInBlock(oSource, true);

    this._oRequestParams.start = 0;
    this._getPosts(oSource, function(oData) {
        processJsonData(oData);

        $this.init(true);

        if(typeof onLoad == 'function')
            onLoad();
    });
};

/**
 * Changes the current view type (e.g., public, personal).
 * @param {object} oLink - Link element triggering the change.
 * @param {string} sType - Type of view to switch to.
 * @param {object} oRequestParams - Additional request parameters.
 */
BxTimelineView.prototype.changeView = function(oLink, sType, oRequestParams)
{
    var $this = this;
    var oViews = $(this._getHtmlId('views_content', this._oRequestParams, {with_type: false})); 

    var oViewBefore = $(this._getHtmlId('main', this._oRequestParams));
    if(!oViewBefore.length)
        oViewBefore = oViews.children(':visible');

    var oViewPlaceholder = $(this._getHtmlId('main', jQuery.extend({}, this._oRequestParams, {type: 'placeholder'})));
    var bViewPlaceholder = oViewPlaceholder && oViewPlaceholder.length != 0;

    if(this._sVideosAutoplay != 'off')
        this.pauseVideos(oViewBefore);

    this._oRequestParams.start = 0;
    this._oRequestParams.per_page = undefined;
    this._oRequestParams.per_page_default = undefined;
    this._oRequestParams.type = sType;

    var oTab = $(oLink);
    var sTabActive = 'bx-menu-tab-active';
    oTab.parents('.bx-db-menu:first').find('li.' + sTabActive).removeClass(sTabActive);
    oTab.parents('li:first').addClass(sTabActive);

    var sView = this._getHtmlId('main', this._oRequestParams);
    if(oViews.find(sView).length !== 0) {
        oViewBefore.hide();
        if(bViewPlaceholder) {
            oViewPlaceholder.bx_anim('show', this._sAnimationEffect, this._iAnimationSpeed, function() {
                oViewPlaceholder.hide();
                oViews.find(sView).show();
            });            
        }
        else
            oViews.find(sView).show();

        this.initView();
        return;
    }

    var oData = this._getDefaultData(oLink);
    if(oRequestParams != undefined)
        oData = jQuery.extend({}, oData, oRequestParams);

    if(bViewPlaceholder) {
        oViewBefore.hide();
        oViewPlaceholder.show();
    }
    else
        this.loadingIn(oLink, true);

    jQuery.get (
        this._sActionsUrl + 'get_view',
        oData,
        function(oResponse) {
            if(bViewPlaceholder)
                oViewPlaceholder.hide();
            else
                $this.loadingIn(oLink, false);                

            if(!oResponse.content) {
                if(oViewBefore.is(':hidden'))
                    oViewBefore.show();

                return;
            }

            oViews.append(oResponse.content).find(sView).bxProcessHtml();
        },
        'json'
    );
};

/**
 * Changes the current page in the timeline.
 * @param {object} oLink - Link element triggering the change.
 * @param {number} iStart - Start index for pagination.
 * @param {number} iPerPage - Number of items per page.
 * @param {function} onLoad - Callback to execute after page change.
 */
BxTimelineView.prototype.changePage = function(oLink, iStart, iPerPage, onLoad)
{
    if(this._bInfScroll)
        this._iInfScrollPreloads = 1;

    this._getPage(oLink, iStart, iPerPage, onLoad);
};

/**
 * Changes the filter applied to the timeline.
 * @param {object} oLink - Link element triggering the filter change.
 */
BxTimelineView.prototype.changeFilter = function(oLink)
{
    var sId = $(oLink).attr('id');
    sId = sId.substr(sId.lastIndexOf('-') + 1, sId.length);

    this.loadingInBlock(oLink, true);

    this._oRequestParams.start = 0;
    this._oRequestParams.filter = sId;
    this._getPosts(oLink);
};

/**
 * Changes the timeline to a specific date.
 * @param {object} oLink - Link element triggering the change.
 * @param {string} sDate - Date string to filter timeline.
 */
BxTimelineView.prototype.changeTimeline = function(oLink, sDate)
{
    var $this = this;

    oLink = $(oLink);
    var bLink = oLink.length > 0;
    var bLoadingInButton = bLink && oLink.hasClass('bx-btn');

    if(bLink) {
        if(bLoadingInButton)
            this.loadingInButton(oLink, true);
        else
            this.loadingInBlock(oLink, true);
    }

    this._oRequestParams.start = 0;
    this._oRequestParams.timeline = sDate;
    this._getPosts(oLink, function(oData) {
        if(bLink) {
            if(bLoadingInButton)
                $this.loadingInButton(oLink, false);
            else
                $this.loadingInBlock(oLink, false);
        }

        window.scrollTo(0, $this.oView.offset().top - 150);

        processJsonData(oData);
    });
};

/**
 * Initializes the calendar date picker for the timeline.
 */
BxTimelineView.prototype.initCalendar = function()
{
    var $this = this;
    var oInput = $('.' + $this.sSP + '-jump-to-calendar');
    if(!oInput.length)
        return;

    var oInputPicker = oInput.parents('.flatpickr:first');
    if(!oInputPicker.length)
        return;

    flatpickr(oInputPicker.get(0), {
        wrap: true,
        dateFormat: "Y-m-d",
        minDate: 1900,
        maxDate: "today",
        onValueUpdate: function(aDates, sDate, oPicker){
            $this.changeTimeline(oInputPicker.find('.bx-btn'), sDate);
        }
    });
};

/**
 * Isn't needed for now, because 'flatpickr' picker is used.
 * Saved for possible future usage.
 * Shows the calendar popup (currently not used).
 * @param {object} oLink - Link element triggering the calendar.
 */
BxTimelineView.prototype.showCalendar = function(oLink)
{
};

/**
 * Expands overflowing content to show more text.
 * @param {object} oLink - Link element triggering the action.
 */
BxTimelineView.prototype.showMore = function(oLink)
{
    var sClassOverflow = this.sSP + '-overflow';

    $(oLink).parents('.' + this.sClassItem + ':first').find('.' + sClassOverflow).css('max-height', 'none').removeClass(sClassOverflow);
    $(oLink).parents('.' + this.sSP + '-content-show-more:first').remove();

    if(this.bViewOutline)
        this.reloadMasonry();
};

/**
 * Shows a timeline item in a popup.
 * @param {object} oLink - Link element triggering the action.
 * @param {number} iId - Item ID to show.
 * @param {string} sMode - Display mode.
 * @param {object} oParams - Additional parameters.
 * @returns {boolean} - Always returns false.
 */
BxTimelineView.prototype.showItem = function(oLink, iId, sMode, oParams)
{
    var $this = this;
    var oData = $.extend({}, this._getDefaultData(), {id: iId, mode: sMode}, (oParams != undefined ? oParams : {}));

    $(".bx-popup-full-screen.bx-popup-applied:visible").dolPopupHide();

    $(window).dolPopupAjax({
        id: {
            value: this._getHtmlId('item_popup', this._oRequestParams, {whole: false, hash: false}) + iId, 
            force: true
        },
        url: bx_append_url_params(this._sActionsUrl + 'get_item_brief', oData),
        closeOnOuterClick: false,
        removeOnClose: true,
        fullScreen: true,
        displayMode: 'box',
        onLoad: function(oPopup) {
            var sClassImages = $this.sSP + '-bview-images';
            var sClassImage = $this.sSP + '-bview-image';
            var oParent = $(oPopup).find('.' + sClassImages);

            if(oParent.length > 0 && oParent.find('.' + sClassImage).length > 1)
                $this.initFlickityImages(oParent, '.' + sClassImage);
        }
    });

    return false;
};

/**
 * Loads and toggles comments for a timeline item.
 * @param {object} oLink - Link element triggering the action.
 * @param {string} sSystem - Comment system identifier.
 * @param {number} iId - Item ID for comments.
 */
BxTimelineView.prototype.commentItem = function(oLink, sSystem, iId)
{
    var $this = this;
    var oData = this._getDefaultData(oLink);
    oData['system'] = sSystem;
    oData['id'] = iId;

    var oComments = $(oLink).parents('.' + this.sClassItem + ':first').find('.' + this.sClassItemComments);
    if(oComments.children().length > 0) {
        oComments.bx_anim('toggle', this._sAnimationEffect, this._iAnimationSpeed);
        $(oLink).parents('.cmt-counter').toggleClass('cmt-counter-opened');
    	return;
    }

    if(oLink)
    	this.loadingInItem(oLink, true);

    jQuery.get (
        this._sActionsUrl + 'get_comments',
        oData,
        function(oData) {
            if(oLink)
                $this.loadingInItem(oLink, false);

            if(!oData.content)
                return;

            oComments.html($(oData.content).hide()).children(':hidden').bxProcessHtml().bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed);
            $(oLink).parents('.cmt-counter').toggleClass('cmt-counter-opened');
        },
        'json'
    );
};

/**
 * Pins a timeline post.
 * @param {object} oLink - Link element triggering the action.
 * @param {number} iId - Item ID to pin.
 * @param {number} iWay - Pin direction or state.
 */
BxTimelineView.prototype.pinPost = function(oLink, iId, iWay)
{
    this._markPost(oLink, iId, iWay, 'pin');
};

/**
 * Callback after pinning a post.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype.onPinPost = function(oData)
{
    this._onMarkPost(oData, 'pin');
};

/**
 * Sticks a timeline post.
 * @param {object} oLink - Link element triggering the action.
 * @param {number} iId - Item ID to stick.
 * @param {number} iWay - Stick direction or state.
 */
BxTimelineView.prototype.stickPost = function(oLink, iId, iWay)
{
    this._markPost(oLink, iId, iWay, 'stick');
};

/**
 * Callback after sticking a post.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype.onStickPost = function(oData)
{
    this._onMarkPost(oData, 'stick');
};

/**
 * Promotes a timeline post.
 * @param {object} oLink - Link element triggering the action.
 * @param {number} iId - Item ID to promote.
 * @param {number} iWay - Promotion direction or state.
 */
BxTimelineView.prototype.promotePost = function(oLink, iId, iWay)
{
    var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide({
        onHide: function(oPopup) {
            $(oPopup).remove();
        }
    });

    var oLoadingContainer = $(this._getHtmlId('item', this._oRequestParams, {whole: false}) + iId);

    this.loadingInItem(oLoadingContainer, true);

    $.post(
        this._sActionsUrl + 'promote/',
        oData,
        function(oData) {
            $this.loadingInItem(oLoadingContainer, false);

            processJsonData(oData);
        },
        'json'
    );
};

/**
 * Sends request to a server everytime an Item was viewed.
 * Note. Isn't used for now.
 */
BxTimelineView.prototype.markPostAsViewedSingle = function(oView)
{
    var $this = this;

    var oItems = oView.find('.' + this.sClassItem);
    var sPrefix = this._getHtmlId('item', this._oRequestParams, {whole: false}).replace('#', '');

    oItems.each(function() {
        if($this._bAutoMarkBusy)
            return;

        var oItem = $(this);
        var iId = parseInt(oItem.attr('id').replace(sPrefix, ''));
        if($this._aMarkedAsViewed.includes(iId))
            return;

        var iItemTop = oItem.offset().top;
        var iItemBottom = iItemTop + oItem.height();
        var iWindowTop = $(window).scrollTop();
        var iWindowHeight = $(window).height();
        if(iItemBottom < iWindowTop + iWindowHeight) {
            $this._bAutoMarkBusy = true;

            var oData = $this._getDefaultData();
            oData['id'] = iId;

            $.post(
                $this._sActionsUrl + 'mark_as_read/',
                oData,
                function(oData) {
                    if(oData && oData.id != undefined)
                        $this._aMarkedAsViewed.push(oData.id);

                    $this._bAutoMarkBusy = false;
                },
                'json'
            );
        }
    });
};

/**
 * Collects all viewed items in an array and sends only one request to a server on 'beforeunload'.
 */
BxTimelineView.prototype.markPostAsViewed = function(oView)
{
    var $this = this;

    var oItems = oView.find('.' + this.sClassItem);
    var sPrefix = this._getHtmlId('item', this._oRequestParams, {whole: false}).replace('#', '');

    oItems.each(function() {
        var oItem = $(this);
        var iId = parseInt(oItem.attr('id').replace(sPrefix, ''));
        if($this._aMarkAsViewed.includes(iId) || $this._aMarkedAsViewed.includes(iId))
            return;

        var iItemTop = oItem.offset().top;
        var iItemBottom = iItemTop + oItem.height();
        var iWindowTop = $(window).scrollTop();
        var iWindowHeight = $(window).height();
        if(iItemBottom < iWindowTop + iWindowHeight)
            $this._aMarkAsViewed.push(iId);        
    });
};

BxTimelineView.prototype.sendMarkPostAsViewed = function()
{
    var $this = this;
    var oData = $this._getDefaultData();
    oData['id'] = this._aMarkAsViewed;

    $.post({
        url: this._sActionsUrl + 'mark_as_read/',
        data: oData,
        dataType: 'json',
        success: function(oData) {
            if(!oData || !oData.id) 
                return;

            if(Array.isArray(oData.id)) 
                $this._aMarkedAsViewed = [...$this._aMarkedAsViewed, ...oData.id];
            else
                $this._aMarkedAsViewed.push(oData.id);
        },
        async: false
    });
};

BxTimelineView.prototype.muteAuthor = function(oLink, iId)
{
    var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide({
        onHide: function(oPopup) {
            $(oPopup).remove();
        }
    });

    var oLoadingContainer = $(this._getHtmlId('item', this._oRequestParams, {whole: false}) + iId);

    this.loadingInItem(oLoadingContainer, true);

    $.post(
        this._sActionsUrl + 'mute/',
        oData,
        function(oData) {
            $this.loadingInItem(oLoadingContainer, false);

            processJsonData(oData);
        },
        'json'
    );
};

/**
 * Initializes the form for editing a timeline post.
 * @param {string} sFormId - The ID of the form element.
 * @param {number} iEventId - The ID of the event being edited.
 */
BxTimelineView.prototype.initFormEdit = function(sFormId, iEventId)
{
    var $this = this;
    var oForm = $('#' + sFormId);
    var oTextarea = oForm.find('textarea');

    autosize(oTextarea);

    oForm.ajaxForm({
        dataType: "json",
        beforeSubmit: function (formData, jqForm, options) {
            window[$this._sObjName].beforeFormEditSubmit(oForm);
        },
        success: function (oData) {
            window[$this._sObjName].afterFormEditSubmit(oForm, oData);
        }
    });

    this.initTrackerInsertSpace(sFormId, iEventId);

    var sContent = oTextarea.val();
    if(sContent && sContent.length > 0)
        this.parseContent(oForm, iEventId, sContent, false);

    oForm.bxConvertEmbeds();
};

/**
 * Callback before submitting the edit form.
 * @param {object} oForm - The form element being submitted.
 */
BxTimelineView.prototype.beforeFormEditSubmit = function(oForm)
{
    this.loadingInButton($(oForm).children().find(':submit'), true);
};

/**
 * Callback after submitting the edit form.
 * @param {object} oForm - The form element that was submitted.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype.afterFormEditSubmit = function (oForm, oData)
{
    var $this = this;
    var fContinue = function() {
        var iId = 0;
        if(oData && oData.id != undefined)
            iId = parseInt(oData.id);

        if(oData && oData.form != undefined && oData.form_id != undefined) {
            $('#' + oData.form_id).replaceWith(oData.form);
            $this.initFormEdit(oData.form_id, iId);

            return;
        }

        if(iId > 0) 
            $this._getPost($this.oView, iId, $this._oRequestParams);
    };

    this.loadingInButton($(oForm).children().find(':submit'), false);

    if(oData && oData.message != undefined)
        bx_alert(oData.message, fContinue);
    else
        fContinue();
};

/**
 * Edits a timeline post.
 * @param {object} oLink - The link element triggering the edit.
 * @param {number} iId - The ID of the post to edit.
 */
BxTimelineView.prototype.editPost = function(oLink, iId)
{
    var $this = this;
    var oData = this._getDefaultData(oLink);
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide();

    var oItem = this.oView.find(this._getHtmlId('item', this._oRequestParams, {whole: false}) + iId);

    var oContent = oItem.find('.' + this.sClassItemContent);
    if(oContent.find('form').length) {
        $(oContent).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
            $(this).html($this._oSaved[iId]).bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed);
        });
        return;
    }
    else
        this._oSaved[iId] = oContent.html();

    this.loadingInItem(oItem, true);

    jQuery.post (
        this._sActionsUrl + 'get_edit_form/' + iId + '/',
        oData,
        function (oData) {
            processJsonData(oData);
        },
        'json'
    );
};

/**
 * Callback after loading the edit form.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype.onEditPost = function(oData)
{
    var $this = this;

    if(!oData || !oData.id)
        return;

    var oItem = $(this._getHtmlId('item', this._oRequestParams, {whole: false}) + oData.id);

    this.loadingInItem(oItem, false);

    if(oData && oData.form != undefined && oData.form_id != undefined) {
        oItem.find('.' + this.sClassItemContent).bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
            $(this).html(oData.form).bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
                $this.initFormEdit(oData.form_id, oData.id);
            });
        });
    }
};

/**
 * Cancels editing a post and restores the previous content.
 * @param {object} oButton - The button element triggering the cancel.
 * @param {number} iId - The ID of the post to cancel editing for.
 */
BxTimelineView.prototype.editPostCancel = function(oButton, iId)
{
    this.editPost(oButton, iId);
};

/**
 * Deletes a timeline post after confirmation.
 * @param {object} oLink - The link element triggering the delete.
 * @param {number} iId - The ID of the post to delete.
 */
BxTimelineView.prototype.deletePost = function(oLink, iId)
{
    var $this = this;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide();

    bx_confirm('', function() {
        var oData = $this._getDefaultData();
        oData['id'] = iId;

        $this.loadingInItem($($this._getHtmlId('item', $this._oRequestParams, {whole: false}) + iId), true);

        $.post(
            $this._sActionsUrl + 'delete/',
            oData,
            function(oData) {
                processJsonData(oData);
            },
            'json'
        );
    });
};

/**
 * Callback after deleting a post.
 * Handles UI updates for different views after a post is deleted.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype.onDeletePost = function(oData)
{
    var $this = this;
    var oItem = $(this._getHtmlId('item', this._oRequestParams, {whole: false}) + oData.id);

    //--- Delete from 'Timeline' (if available)
    if(this.bViewTimeline) {
        oItem.bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
            $(this).remove();

            if($this.oView.find('.' + $this.sClassItem).length == 0) {
                $this.oView.find('.' + $this.sClassDividerToday).hide();
                $this.oView.find('.' + $this.sSP + '-load-more').hide();
                $this.oView.find('.' + $this.sSP + '-empty').show();
            }
        });

        return;
    }

    //--- Delete from 'Outline' (if available)
    if(this.bViewOutline) {
        oItem.bx_anim('hide', this._sAnimationEffect, this._iAnimationSpeed, function() {
            $(this).remove();

            if($this.oView.find('.' + $this.sClassItem).length == 0) {
                $this.destroyMasonry();

                $this.oView.find('.' + $this.sSP + '-load-more').hide();
                $this.oView.find('.' + $this.sSP + '-empty').show();
            } 
            else
                $this.reloadMasonry();
        });

        return;
    }

    //--- Delete from 'View Item' page.
    if(this._sReferrer.length != 0)
        document.location = this._sReferrer;
};

/**
 * Callback for connect action, removes the element from the DOM.
 * @param {object} eElement - The element to remove.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype.onConnect = function(eElement, oData)
{
    $(eElement).remove();
};

/*----------------------------*/
/*--- Live Updates methods ---*/
/*----------------------------*/

/**
 * Navigates to a specific timeline item and highlights it.
 * @param {object} oLink - The link element triggering the action.
 * @param {string} sGoToId - The ID to scroll to.
 * @param {string} sBlinkIds - IDs to highlight.
 * @param {function} onLoad - Callback after navigation.
 */
BxTimelineView.prototype.goTo = function(oLink, sGoToId, sBlinkIds, onLoad)
{
    var $this = this;

    this.loadingInPopup(oLink, true);

    this._oRequestParams.start = 0;
    this._oRequestParams.blink = sBlinkIds;
    this._getPosts(this.oView, function(oData) {
        $this.loadingInPopup(oLink, false);

        $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide();

        oData.go_to = sGoToId;
        processJsonData(oData);
    });
};

/**
 * Navigates to a specific timeline item using a button and highlights it.
 * @param {object} oLink - The button element triggering the action.
 * @param {string} sGoToId - The ID to scroll to.
 * @param {string} sBlinkIds - IDs to highlight.
 * @param {function} onLoad - Callback after navigation.
 */
BxTimelineView.prototype.goToBtn = function(oLink, sGoToId, sBlinkIds, onLoad)
{
    var $this = this;

    this.loadingInButton(oLink, true);

    this._oRequestParams.start = 0;
    this._oRequestParams.blink = sBlinkIds;
    this._getPosts(this.oView, function(oData) {
        oData.go_to = sGoToId;
        processJsonData(oData);

        $this.loadingInButton(oLink, false);
        $(oLink).parents('.' + $this.sSP + '-live-update-button:first').remove();

        $this.resumeLiveUpdates();
    });
};

/*
 * Show only one live update notification for all new events.
 * 
 * @param {object} oData - Data containing the notification code.
 * Note. oData.count_old and oData.count_new are also available and can be checked or used in notification popup.
 */
BxTimelineView.prototype.showLiveUpdate = function(oData)
{
    if(!oData.code)
        return;

    var oButton = $(oData.code);
    var sId = oButton.attr('id');
    $('#' + sId).remove();

    oButton.prependTo(this.oView);
};

/*
 * Show separate live update notification for each new Event.
 * 
 * Note. This way to display live update notifications isn't used for now. 
 * See BxTimelineView::showLiveUpdate method instead.
 * 
 * Note. oData.count_old and oData.count_new are also available and can be checked or used in notification popup.
 */
BxTimelineView.prototype.showLiveUpdates = function(oData)
{
    if(!oData.code)
        return;

    var $this = this;

    var oItems = $(oData.code);
    var sId = oItems.attr('id');
    $('#' + sId).remove();

    oItems.prependTo('body').dolPopup({
        position: 'fixed',
        left: '1rem',
        top: 'auto',
        bottom: '1rem',
        fog: false,
        onBeforeShow: function() {
        },
        onBeforeHide: function() {
        },
        onShow: function() {
            setTimeout(function() {
                $('.bx-popup-chain.bx-popup-applied:visible:first').dolPopupHide();
            }, 5000);
        },
        onHide: function() {
            $this.resumeLiveUpdates();
        }
    });
};

/**
 * Shows the previous live update notification in the chain.
 * @param {object} oLink - The link element triggering the action.
 */
BxTimelineView.prototype.previousLiveUpdate = function(oLink)
{
    var fPrevious = function() {
        var sClass = 'bx-popup-chain-item';
        $(oLink).parents('.' + sClass + ':first').hide().prev('.' + sClass).show();
    };

    if(!this.pauseLiveUpdates(fPrevious));
        fPrevious();
};

/**
 * Hides the current live update notification popup.
 * @param {object} oLink - The link element triggering the action.
 */
BxTimelineView.prototype.hideLiveUpdate = function(oLink)
{
    $(oLink).parents('.bx-popup-applied:visible:first').dolPopupHide();
};

/**
 * Resumes live updates if they are paused.
 * @param {function} onLoad - Callback after resuming.
 * @returns {boolean} - True if resumed, false otherwise.
 */
BxTimelineView.prototype.resumeLiveUpdates = function(onLoad)
{
    if(!this._bLiveUpdatePaused)
        return false;

    var $this = this;
    this.changeLiveUpdates('resume_live_update', function() {
        $this._bLiveUpdatePaused = false;

        if(typeof onLoad == 'function')
            onLoad();
    });

    return true;
};

/**
 * Pauses live updates if they are running.
 * @param {function} onLoad - Callback after pausing.
 * @returns {boolean} - True if paused, false otherwise.
 */
BxTimelineView.prototype.pauseLiveUpdates = function(onLoad)
{
    if(this._bLiveUpdatePaused)
        return false;

    var $this = this;
    this.changeLiveUpdates('pause_live_update', function() {
        $this._bLiveUpdatePaused = true;

        if(typeof onLoad == 'function')
            onLoad();
    });

    return true;
};

/**
 * Sends a request to change the live update state (pause/resume).
 * @param {string} sAction - The action to perform.
 * @param {function} onLoad - Callback after the request.
 */
BxTimelineView.prototype.changeLiveUpdates = function(sAction, onLoad)
{
    var $this = this;
    var oParams = this._getDefaultActions();
    oParams['action'] = sAction;

    jQuery.get(
        this._sActionsUrl + sAction + '/',
        oParams,
        function() {
            if(typeof onLoad == 'function')
                onLoad();
        }
    );
};

/**
 * Copies a link to the clipboard and hides any visible popups.
 * @param {object} oElement - The element triggering the copy.
 * @param {string} sLink - The link to copy.
 */
BxTimelineView.prototype.copyToClipboard = function(oElement, sLink)
{
    bx_copy_to_clipboard(sLink, function() {
        $('.bx-popup-applied:visible').dolPopupHide();
    });
};

/**
 * Animates and removes the highlight from blinking items.
 * @param {jQuery} oParent - The parent element containing items to blink.
 */
BxTimelineView.prototype.blink = function(oParent)
{
    oParent.find('.' + this.sClassBlink + '-plate:visible').animate({
        opacity: 0
    }, 
    5000, 
    function() {
        oParent.find('.' + this.sClassBlink).removeClass(this.sClassBlink);
    });
};


/*------------------------------------*/
/*--- Internal (protected) methods ---*/
/*------------------------------------*/

/**
 * Loads a page of timeline posts and appends or processes them in the view.
 * @param {object} oElement - The element triggering the load.
 * @param {number} iStart - Start index for pagination.
 * @param {number} iPerPage - Number of items per page.
 * @param {function} onLoad - Callback after loading.
 */
BxTimelineView.prototype._getPage = function(oElement, iStart, iPerPage, onLoad)
{
    var $this = this;

    if(oElement)
        this.loadingIn(oElement, true);

    this._oRequestParams.start = iStart;
    this._oRequestParams.per_page = iPerPage;
    this._getPosts(oElement, function(oData) {
        if(oElement)
            $this.loadingIn(oElement, false);

    	var sItems = $.trim(oData.items);

        if($this.bViewTimeline)
            $this.oView.find('.' + $this.sClassItems).append($(sItems).hide()).find('.' + $this.sClassItem + ':hidden').bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
                $(this).bxProcessHtml();

                //-- Check content to show 'See More'
                $this.initSeeMore($(this), false);

                //-- Init Flickity
                $this.initFlickity($this.oView);

                //--- Init Video Autoplay
                $this.initVideosAutoplay($this.oView);
            });

        if($this.bViewOutline)
            $this.appendMasonry($(sItems).bxProcessHtml(), function(oItems) {
                //-- Check content to show 'See More'
                $this.initSeeMore(oItems, false);

                //-- Init Flickity
                $this.initFlickity($this.oView);

                //--- Init Video Layout
                if($this._sVideosAutoplay != 'off') 
                    $this.initVideos($this.oView);
            });

    	if(oData && oData.load_more != undefined) {
            $this.oView.find('.' + $this.sSP + '-load-more-holder').html($.trim(oData.load_more));

            $this.initCalendar();
        }

    	if(oData && oData.back != undefined)
            $this.oView.find('.' + $this.sSP + '-back-holder').html($.trim(oData.back));

    	if(oData && oData.empty != undefined && !$this.oView.find('.' + $this.sClassItem).length)
            $this.oView.find('.' + $this.sSP + '-empty-holder').html($.trim(oData.empty));

        if(typeof onLoad == 'function')
            onLoad(oData);
    });
};

/**
 * Loads timeline posts from the server.
 * @param {object} oElement - The element triggering the load.
 * @param {function} onComplete - Callback after loading.
 */
BxTimelineView.prototype._getPosts = function(oElement, onComplete)
{
    var $this = this;
    var oData = this._getDefaultData(oElement);

    jQuery.get(
        this._sActionsUrl + 'get_posts/',
        oData,
        function(oData) {
            if(typeof onComplete === 'function')
                return onComplete(oData);

            if(oElement)
                $this.loadingInBlock(oElement, false);

            processJsonData(oData);
        },
        'json'
    );
};

/**
 * Callback after loading posts, updates the UI accordingly.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype._onGetPosts = function(oData)
{
    var $this = this;

    var onComplete = function() {
        if(oData && oData.go_to != undefined)
            location.hash = oData.go_to;

        if(oData && oData.load_more != undefined) {
            $this.oView.find('.' + $this.sSP + '-load-more-holder').html($.trim(oData.load_more));

            $this.initCalendar();
        }

        if(oData && oData.back != undefined)
            $this.oView.find('.' + $this.sSP + '-back-holder').html($.trim(oData.back));

        if(oData && oData.empty != undefined)
            $this.oView.find('.' + $this.sSP + '-empty-holder').html($.trim(oData.empty));
    };

    if(oData && oData.items != undefined) {
        var sItems = $.trim(oData.items);

        if(this.bViewTimeline) {
            var oItems = this.oView.find('.' + this.sClassItems);
            oItems.html(sItems).bxProcessHtml();

            this.blink(oItems);
            this.initFlickity(this.oView);            

            onComplete();
            return;
        }

        if(this.bViewOutline) {
            oItems = this.oView.find('.' + this.sClassItems);
            oItems.html(sItems).bxProcessHtml();

            if(this.isMasonry())
                this.destroyMasonry();

            if(!this.isMasonryEmpty())
                this.initMasonry();

            this.blink(oItems);
            this.initFlickity(this.oView);

            onComplete();
            return;
        }
    }
};

/**
 * Callback after loading a single post, updates the UI accordingly.
 * @param {object} oData - Data returned from the server.
 */
BxTimelineView.prototype._onGetPost = function(oData)
{
    if(!$.trim(oData.item).length) 
        return;

    var $this = this;
    var sItem = this._getHtmlId('item', this._oRequestParams, {whole:false}) + oData.id;
    this.oView.find(sItem).replaceWith($(oData.item).bxProcessHtml());
    this.oView.find(sItem).find('.bx-tl-item-text .bx-tl-content').bxCheckOverflowHeight(this.sSP + '-overflow', function(oElement) {
        $this.onFindOverflow(oElement);
    });

    this.initFlickity(this.oView);
};

/**
 * Sends a request to mark a post (pin, stick, etc.).
 * @param {object} oLink - The link element triggering the action.
 * @param {number} iId - The ID of the post.
 * @param {number} iWay - The direction or state.
 * @param {string} sAction - The action to perform.
 */
BxTimelineView.prototype._markPost = function(oLink, iId, iWay, sAction)
{
    var oData = this._getDefaultData();
    oData['id'] = iId;

    $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide({
        onHide: function(oPopup) {
            $(oPopup).remove();
        }
    });

    this.loadingInItem($(this._getHtmlId('item', this._oRequestParams, {whole:false}) + iId), true);

    $.post(
        this._sActionsUrl + sAction + '/',
        oData,
        function(oData) {
        	processJsonData(oData);
        },
        'json'
    );
};

/**
 * Callback after marking a post, updates the UI accordingly.
 * @param {object} oData - Data returned from the server.
 * @param {string} sAction - The action performed.
 */
BxTimelineView.prototype._onMarkPost = function(oData, sAction)
{
    var $this = this;
    var sItem = this._getHtmlId('item', this._oRequestParams, {whole:false}) + oData.id;

    this._oRequestParams.start = 0;

    //--- Mark on Timeline (if available)
    if(this.bViewTimeline)
        this._getPosts(this.oView, function(oData) {
            $(sItem).bx_anim('hide', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
                $(this).remove();

                processJsonData(oData);
            });
        });

    //--- Mark on Outline (if available)
    if(this.bViewOutline)
        this._getPosts(this.oView, function(oData) {
            $this.removeMasonry(sItem, function() {
                processJsonData(oData);
            });
        });
};

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
