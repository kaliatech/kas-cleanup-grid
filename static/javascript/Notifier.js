(function(KAS, $) {
  "use strict";

  KAS.Notifier = function(pageCfg) {
    this.$popupCont = $('nav')
  }

  KAS.Notifier.prototype.show = function(opts) {
    
    this.$popupCont.popover('dispose')
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    
    let content = ''
    if (opts.icon) {
      content = "<div class='icon'><i class='material-icons" +
        (opts.spin ? " spin" : "") +
        "'>" + opts.icon + "</i> " +
        "<span>" + opts.txt + "</span></div>"
    }
    else {
      content = "<div>" + opts.txt + "</div>"
    }

    this.$popupCont.popover({
      container: 'nav',
      placement: 'bottom',
      html: true,
      content: content,
      trigger: 'manual'
    })
    this.$popupCont.popover('show')
    
    if (opts.autoClose) {
      this.timeoutId = setTimeout(() => {
        this.hide()
      }, opts.autoClose)      
    }
  }

  KAS.Notifier.prototype.hide = function() {
    this.$popupCont.popover('hide')
  }

}(window.KAS = window.KAS || {}, jQuery));
