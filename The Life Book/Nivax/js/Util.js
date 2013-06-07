; (function () {

    WinJS.Namespace.define("Util", {
        config: {
            logLevel: "debug",
            logLevels: ['debug', 'info', 'error']
        },

        /*Debug module */
        log: function (params, level) {
            var z = this;
            if (z.config.logLevel == "never") return;
            var i = z.config.logLevels.indexOf(level);
            var j = z.config.logLevels.indexOf(z.config.logLevel);
            if (i > -1 && j > -1 && i >= j) {
                console.log.apply(console, params);
            }
        },
        debug: function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[Debug]:');
            this.log(args, 'debug');
        },
        info: function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[Info]:');
            this.log(args, 'info');
        },
        error: function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[Error!!!]:');
            this.log(args, 'error');
        },

        /*Time module*/  

        getUTCInt: function (date) {
            if (date == 'now') {
                return Date.parse(new Date()) / 1000;
            }
        },

        getLocalFormatDateFromUTCInt: function (date, value) {
            /*value = 1 return like this  : Today,May 2011
              value = 2 return like this  : 3/15/2012
              defalut return like this  : 3/15/2012 12:33
            */
            var Dateo = new Date(date * 1000);
            date = new Date(date * 1000).toString().split(' ');
            var now = new Date().toString().split(' ');
            if (value == 1) {
                return ((date[5] === now[5] && date[1] === now[1] && date[2] === now[2]) ? 'Today' : date[1] + ' ' + date[5]);
            } else if (value == 2) {
                return (Dateo.getMonth() + 1) + '/' + date[2] + '/' + date[5];
            } else if (value == 3) {
                return (Dateo.getMonth() + 1) + date[2] + date[5];
            } else if (value == 4) {
                return ((date[5] === now[5] && date[1] === now[1] && date[2] === now[2]) ? 'Today' : date[1] + '.' + date[2]);
            } else {
                return (Dateo.getMonth() + 1) + '/' + date[2] + '/' + date[5] + ' ' + date[3].slice(0, 5);
            }
        },
        UTCtoLocalDate: function (time) {
            var a = new Date(time * 1000);
            return a.toLocaleDateString(time);
        },
        UTCtoLocalTime: function (time) {
            var a = new Date(time * 1000);
            return a.toLocaleTimeString(time);
        },

        /*Pin Model*/
        PinByDescription: function (des, rect) {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                var TileID = "QuickNote.ID_" + des.id;
                var uriLogo = new Windows.Foundation.Uri("ms-appx:///images/tilelogo.png");
                var uriWideLogo = new Windows.Foundation.Uri("ms-appx:///images/tilewide.png");
                var tileActivationArguments = "ID=" + des.id;
                var tile = new Windows.UI.StartScreen.SecondaryTile(TileID,
                                                                    des.title,
                                                                    des.title,
                                                                    tileActivationArguments,
                                                                    Windows.UI.StartScreen.TileOptions.showNameOnWideLogo,
                                                                    uriLogo,
                                                                    uriWideLogo);
                tile.foregroundText = Windows.UI.StartScreen.ForegroundText.light;
                //var ds = des.color.split(/\D+/);
                //if (ds[1] == undefined || ds[2] == undefined || ds[3] == undefined) {
                //    ds = [0, 255, 252, 196];
                //}
                tile.backgroundColor = { a: 255, r: 30, g: 20, b: 24 };
                tile.requestCreateAsync({ x: rect.left, y: rect.top }).then(function (isCreated) {
                    if (isCreated) {
                        z.UpdateTileNotification(TileID, des);
                        comp(true);
                    } else {
                        comp(false);
                    }
                });

            });
        },

        unPinByTileID: function (TileID, rect) {
            return new WinJS.Promise(function (comp, err, prog) {
                var TileToDelete = new Windows.UI.StartScreen.SecondaryTile(TileID);
                TileToDelete.requestDeleteAsync({ x: rect.left, y: rect.top }).then(function (isDelete) {
                    comp(true);
                });
            });
        },

        UpdateTileNotification: function (TileID, des) {
            if (Windows.UI.StartScreen.SecondaryTile.exists(TileID)) {
                var Notifications = Windows.UI.Notifications;
                var tileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.tileWideText09);
                var tileTextAttributes = tileXml.getElementsByTagName("text");
                tileTextAttributes[0].appendChild(tileXml.createTextNode(des.title));
                tileTextAttributes[1].appendChild(tileXml.createTextNode(this.FormatToCleanText(des.content)));

                var squareTileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.tileSquareText02);
                var squareTileTextAttributes = squareTileXml.getElementsByTagName("text");
                squareTileTextAttributes[0].appendChild(squareTileXml.createTextNode(des.title));
                squareTileTextAttributes[1].appendChild(squareTileXml.createTextNode(this.FormatToCleanText(des.content)));

                var node = tileXml.importNode(squareTileXml.getElementsByTagName("binding").item(0), true);
                tileXml.getElementsByTagName("visual").item(0).appendChild(node);
                var tileNotification = new Notifications.TileNotification(tileXml);
                try{
                    Notifications.TileUpdateManager.createTileUpdaterForSecondaryTile(TileID).update(tileNotification);
                } catch (e) {
                    Util.error("update notification error: ", e.message);
                }

            }
        },

        TileDataURL: function (text, color) {
            var wide = document.createElement("canvas");
            wide.height = 150;
            wide.width = 300;
            var ctx1 = wide.getContext('2d');
            ctx1.fillStyle = color;
            ctx1.fillRect(0, 0, 300, 150);
            ctx1.fillStyle = "#000";
            ctx1.font = "11pt 'Segoe UI','Microsoft YaHei UI'";
            this.fillText(text, ctx1, 300);

            var small = document.createElement("canvas");
            small.height = 150;
            small.width = 150;
            var ctx2 = small.getContext('2d');
            ctx2.fillStyle = color;
            ctx2.fillRect(0, 0, 150, 150);
            ctx2.fillStyle = "#000";
            ctx2.font = "11pt 'Segoe UI','Microsoft YaHei UI'";
            this.fillText(text, ctx2, 150);

            return [small.toDataURL(),wide.toDataURL()]
        },

        fillText: function (text, ctx, width) {
            var x = 20;
            var y = 20;
            for (var i = 0; i < text.length; i++) {
                var m_x = ctx.measureText(string[i]).width;
                ctx.fillText(text[i], x, y);
                x += m_x;
                if (x > width - 20) {
                    y += 20;
                    x = 20;
                }
            }
        },
        /*Backup /Restore */

        Restore: function () {
            var z = this;
            var openPicker = new Windows.Storage.Pickers.FileOpenPicker();
            openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
            openPicker.fileTypeFilter.replaceAll([".qn"]);
            openPicker.pickSingleFileAsync().then(function (file) {
                if (file) {
                    Util.debug("open file" + file.name);
                    Windows.Storage.FileIO.readLinesAsync(file).then(function (content) {
                        Util.debug(content);
                        var msg = new Windows.UI.Popups.MessageDialog("Are you sure you want to restore your quick notes from a backup? All existing notes in the app will be removed.");
                        msg.commands.append(new Windows.UI.Popups.UICommand("Restore", function (command) {
                            z.AnayticsFile(content);
                        }));
                        msg.commands.append(new Windows.UI.Popups.UICommand("Cancel"));
                        msg.cancelCommandIndex = 1;
                        msg.showAsync();
                    }, function () {

                    });
                } else {

                }
            });
        },

        AnayticsFile: function (backupfile) {
            Util.debug(typeof backupfile);
            var data = [], z = this;
            for (var i = 0; i < backupfile["size"]; i++) {
                try {
                    var tmp_ = JSON.parse(backupfile[i]);
                    if (i > 1) {
                        delete tmp_.id;
                        if (tmp_.title != undefined && tmp_.content != undefined && tmp_.url != undefined && tmp_.list != undefined && tmp_.topic != undefined && tmp_.tag != undefined && tmp_.color != undefined && tmp_.created != undefined && tmp_.updated != undefined) {
                            data.push(tmp_);
                        }
                    } else {
                        data.push(tmp_);
                    }

                } catch (e) {
                    //z.RestoreFileError();
                    continue;
                }

            }

            if (data[0]["BackId"] != "Diigo.QuickNote") {
                z.RestoreFileError();
                return;
            }
            Data.RestoreByFile(data).done(function () {
                WinJS.Navigation.history = {};
                WinJS.Navigation.navigate(Application.navigator.home);
            });

        },

        RestoreFileError: function () {
            //TODO:   
        },

        /*Color*/
        getColorFromId: function (colorid) {
            var colorfact = "";
            var colorabs = "";
            if (colorid == "color1") {
                colorfact = "rgb(255, 252, 196)";
                colorabs = "rgb(255, 251, 171)";
            } else if (colorid == "color2") {
                colorfact = "rgb(255, 220, 220)";
                colorabs = "rgb(255, 182, 182)";
            } else if (colorid == "color3") {
                colorfact = "rgb(255, 214, 184)";
                colorabs = "rgb(255, 212, 95)";
            } else if (colorid == "color4") {
                colorfact = "rgb(223, 247, 195)";
                colorabs = "rgb(206, 241, 130)";
            } else if (colorid == "color5") {
                colorfact = "rgb(195, 242, 243)";
                colorabs = "rgb(167, 239, 220)";
            } else if (colorid == "color6") {
                colorfact = "rgb(175, 218, 255)";
                colorabs = "rgb(138, 210, 255)";
            } else if (colorid == "color7") {
                colorfact = "rgb(210, 206, 245)";
                colorabs = "rgb(177, 167, 247)";
            } else {
                colorfact = "rgb(255, 252, 196)";
                colorabs = "rgb(255, 251, 171)";
            }
            return [colorfact, colorabs];
        },

        getColorId: function (color) {
            var id = "";
            if (color == "rgb(255, 252, 196)" || color == undefined || color == "" || color == "#fffcc4") {
                id = "color1";
            } else if (color == "rgb(255, 220, 220)" || color == "#ffdcdc") {
                id = "color2";
            } else if (color == "rgb(255, 214, 184)" || color == "#ffd6b8") {
                id = "color3";
            } else if (color == "rgb(223, 247, 195)" || color == "#dff7c3") {
                id = "color4";
            } else if (color == "rgb(195, 242, 243)" || color == "#c3f2f3") {
                id = "color5";
            } else if (color == "rgb(175, 218, 255)" || color == "#afdaff") {
                id = "color6";
            } else if (color == "rgb(210, 206, 245)" || color == "#d2cef5") {
                id = "color7";
            } else {
                id = "color1";
            }
            return id;
        },

        /*text format*/

        FormatToCleanText: function (text, isbreak) {
           /*if isbreak=true ,replace the <div> <br /> to /n */
            if (isbreak) {

            } else {
                text = text.replace(/<\s?(span|code|\/span|\/code|cite|\/cite|br*|div|\/div)[^>]*>/gi, '');
            }
            text = text.replace(/&gt;/g, ">");
            text = text.replace(/&lt;/g, "<");
            text = text.replace(/&nbsp;/g, " ");
            return text;
        },

        RemoveHTMLTag: function (text) {
            text = text.replace(/<\s?(span|code|\/span|\/code|cite|\/cite|br*|div|\/div)[^>]*>/gi, '');
            return text;
        }


    });

    WinJS.Namespace.define("TempCovert", {
        _FormatToCleanText:WinJS.Binding.converter(Util.FormatToCleanText.bind(this))
    });

})();