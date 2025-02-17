"use strict";
function userlist(justList) {
  var users = Array.prototype.slice
    .call(document.querySelector("#userlist").children)
    .filter(function (cv) {
      return cv.classList.contains("userlist_item");
    })
    .map(function (elem) {
      return elem.children[1].innerHTML;
    });
  if (justList) {
    return users;
  }
  var userlist = {};
  for (var i = users.length - 1; i >= 0; i--) {
    userlist[users[i]] = findUserlistItem(users[i]).data();
  }
  return userlist;
}
(function (CyTube_Userlist) {
  return CyTube_Userlist(window, document, window.jQuery, String);
})(function (window, document, $, String, undefined) {
  console.info("[XaeTube: Userlist]", "Loading Module.");
  const options = Object.assign(
    {},
    {
      autoHider: false,
      scrutinize: false,
      trustedHosts: new RegExp(["imgur.com"].join("|").replace(/\./g, "\\.")),
      additionalHosts: new RegExp(
        ["some.website"].join("|").replace(/\./g, "\\.")
      ),
    },
    window[CHANNEL.name].modulesOptions
      ? window[CHANNEL.name].modulesOptions.userlist
      : undefined
  );
  function trustAvatar(data) {
    if (!data.profile) {
      return false;
    }
    if (!data.profile.image) {
      return false;
    }
    if (!data.rank > 1) {
      return true;
    }
    if (!options.scrutinize) {
      return true;
    }
    try {
      var url = new URL(link)["host"].split("."),
        tld = url.pop(),
        host = url.pop();
    } catch (e) {
      return false;
    }
    return (
      trustedHosts.test(host + "." + tld) ||
      additionalHosts.test(host + "." + tld)
    );
  }
  window.formatUserlistItem = function (div) {
    var data = {
      name: div.data("name") || "",
      rank: div.data("rank"),
      profile: div.data("profile") || { image: "", text: "" },
      leader: div.data("leader") || false,
      icon: div.data("icon") || false,
    };
    var name = $(div.children()[1]);
    name.removeClass();
    name.css("font-style", "");
    name.addClass(getNameColor(data.rank));
    var user = data.name.replace(/[^\w-]/g, "\\$");
    name.addClass("userlist-" + user);
    name.attr("id", "userlist-" + user);
    name.parent().attr("id", "useritem-" + user);
    if (data.rank === 3) {
      name.addClass("userlist_admin");
    }
    div.find(".profile-box").remove();
    var meta = div.data().meta || {};
    if (meta.afk) {
      div.addClass("userlist_afk");
    } else {
      div.removeClass("userlist_afk");
    }
    if (meta.muted) {
      div.addClass("userlist_muted");
    } else {
      div.removeClass("userlist_muted");
    }
    if (meta.smuted) {
      div.addClass("userlist_smuted");
    } else {
      div.removeClass("userlist_smuted");
    }
    if (data.leader) {
      div.addClass("userlist_leader");
    } else {
      div.removeClass("userlist_leader");
    }
    var icon = div.children()[0];
    icon.innerHTML = "";
    if (data.leader) {
      $("<span/>").addClass("glyphicon glyphicon-star-empty").appendTo(icon);
    }
    if (meta.afk) {
      name.css("font-style", "italic");
      $("<span/>").addClass("glyphicon glyphicon-time").appendTo(icon);
    }
    if (data.icon) {
      $("<span/>")
        .addClass("glyphicon " + data.icon)
        .prependTo(icon);
    }
    var profile = null;
    name.unbind("mouseenter");
    name.unbind("mousemove");
    name.unbind("mouseleave");
    name.mouseenter(function (ev) {
      if (profile) profile.remove();
      var top = ev.clientY + 5;
      var horiz = ev.clientX;
      profile = $("<div/>")
        .addClass("profile-box linewrap")
        .css("top", top + "px")
        .appendTo(div);
      if (trustAvatar(data)) {
        $("<img/>")
          .addClass("profile-image")
          .attr("src", data.profile.image)
          .appendTo(profile);
      }
      $("<strong/>").text(data.name).appendTo(profile);
      var meta = div.data("meta") || {};
      if (meta.ip) {
        $("<br/>").appendTo(profile);
        $("<em/>").text(meta.ip).appendTo(profile);
      }
      if (meta.aliases) {
        $("<br/>").appendTo(profile);
        $("<em/>")
          .text("aliases: " + meta.aliases.join(", "))
          .appendTo(profile);
      }
      $("<hr/>")
        .css("margin-top", "5px")
        .css("margin-bottom", "5px")
        .appendTo(profile);
      $("<p/>").text(data.profile.text).appendTo(profile);
      if ($("body").hasClass("synchtube")) horiz -= profile.outerWidth();
      profile.css("left", horiz + "px");
    });
    name.mousemove(function (ev) {
      var top = ev.clientY + 5;
      var horiz = ev.clientX;
      if ($("body").hasClass("synchtube")) horiz -= profile.outerWidth();
      profile.css("left", horiz + "px").css("top", top + "px");
    });
    name.mouseleave(function () {
      profile.remove();
    });
  };
  void (function () {
    var users = userlist(true);
    for (var i = users.length - 1; i >= 0; i--) {
      findUserlistItem(users[i])
        .find("span:contains(" + users[i] + ")")
        .addClass("userlist-" + users[i])
        .parent()
        .attr("id", "useritem-" + users[i]);
      if (findUserlistItem(users[i]).data()["profile"]) {
        findUserlistItem(users[i]).data()["profile"]["image"] = trustAvatar(
          findUserlistItem(users[i]).data()
        )
          ? findUserlistItem(users[i]).data()["profile"]["image"]
          : null;
      }
    }
  })();
  ({
    hideAfter: 30 * 1e3,
    toggleState: false,
    initialize: function () {
      if (!options.autoHider) {
        return;
      }
      if (localStorage.getItem(`${CHANNEL.name}_autohiderToggle`) !== null) {
        this.toggleState = parseInt(
          localStorage.getItem(`${CHANNEL.name}_autohiderToggle`)
        );
      }
      if (localStorage.getItem(`${CHANNEL.name}_autohiderTimeout`) !== null) {
        this.hideAfter = parseInt(
          localStorage.getItem(`${CHANNEL.name}_autohiderTimeout`)
        );
      }
      if (this.toggleState) {
        if (!isNaN(parseInt(this.hideAfter))) {
          setTimeout(function () {
            if (!$("#userlist").is(":hidden")) {
              $("#userlisttoggle").click();
            }
          }, this.hideAfter);
        }
      }
      this.createCustomSettings();
    },
    toggle: function () {
      $("#ccs-userlisthide_toggle")
        .toggleClass("btn-default btn-warning")
        .find("span.glyphicon")
        .toggleClass("glyphicon-eye-open glyphicon-eye-close");
      if (!this.toggleState) {
        if (!$("#userlist").is(":hidden")) {
          $("#userlisttoggle").click();
        }
      }
      localStorage.setItem(
        `${CHANNEL.name}_autohiderToggle`,
        this.toggleState ? 0 : 1
      );
      this.toggleState = !this.toggleState;
    },
    createCustomSettings: function () {
      $("<div>")
        .prop("id", "UserlistAutohide")
        .addClass("customSettings")
        .attr("data-title", "Userlist Autohider")
        .appendTo("#customSettingsStaging");
      $("<div>")
        .addClass("form-group")
        .append(
          $("<button/>")
            .prop("id", "ccs-userlisthide_toggle")
            .addClass("btn btn-sm col-sm-2")
            .addClass(this.toggleState ? "btn-warning" : "btn-default")
            .attr("title", "Toggle Autohide")
            .html("&nbsp;Toggle")
            .prepend(
              $("<span>")
                .addClass("glyphicon")
                .addClass(
                  this.toggleState
                    ? "glyphicon-eye-close"
                    : "glyphicon-eye-open"
                )
            )
            .click(this.toggle.bind(this))
        )
        .append(
          $("<label>")
            .addClass("control-label col-sm-2")
            .attr("for", "ccs-userlisthide_timeout")
            .prepend(
              $("<span>")
                .addClass("label label-info pull-right")
                .text("Timeout:")
            )
        )
        .append(
          $("<div>")
            .addClass("col-sm-8")
            .append(
              $("<input>")
                .prop("id", "ccs-userlisthide_timeout")
                .addClass("form-control cs-textbox")
                .attr("type", "text")
                .attr(
                  "placeholder",
                  "Delay before hiding in ms. Default is " + this.hideAfter
                )
                .val(this.hideAfter !== 30 * 1e3 ? this.hideAfter : null)
                .keyup(function () {
                  var box = $(this);
                  var value = box.val();
                  var lastkey = Date.now();
                  box.data("lastkey", lastkey);
                  setTimeout(function () {
                    if (
                      box.data("lastkey") !== lastkey ||
                      box.val() !== value
                    ) {
                      return;
                    }
                    if (parseInt(value) > -1) {
                      if (parseInt(value) < 1e4) {
                        box.val(1e4);
                        localStorage.setItem(
                          `${CHANNEL.name}_autohiderTimeout`,
                          1e4
                        );
                        console.log(
                          "Userlist autohiding timeout set to minimum value"
                        );
                      } else {
                        localStorage.setItem(
                          `${CHANNEL.name}_autohiderTimeout`,
                          parseInt(value)
                        );
                        console.log(
                          "Userlist autohiding timeout set to " + value
                        );
                      }
                    } else {
                      box.val("");
                    }
                  }, 1e3);
                })
            )
        )
        .appendTo($("#UserlistAutohide"));
    },
  }).initialize();
});
