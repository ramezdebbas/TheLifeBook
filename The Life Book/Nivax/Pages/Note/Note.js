// 有关“页面控制”模板的简介，请参阅以下文档:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";
    var NoteDes;
    var GroupedNotes;
    var currentIndex;
    var cIndex_ = null;
    var ListLoadingFlag=false;
    var Timer = null;
    var flag = 0;
    var displacement = 0;
    var showingAnimation = null;
    var hidingAnimation = null;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    WinJS.UI.Pages.define("/Pages/Note/Note.html", {
        // 每当用户导航至此页面时都要调用此功能。它
        // 使用应用程序的数据填充页面元素。
        ready: function (element, options) {
            var z = this;
            cIndex_ = options.index;
            //NoteDes = options.item;
            var listView = element.querySelector('#NoteList').winControl;
            Data.getAllNotesDes(true, options.item.id)
                .then(function (groupednotes) {
                    var index = groupednotes[1];
                    groupednotes = groupednotes[0];
                    if (!cIndex_) cIndex_ = index;
                    GroupedNotes = groupednotes;
                    listView.oniteminvoked = z._itemInvokd.bind(z);
                    listView.oncontentanimating = z._oncontentanimating.bind(z);
                    //listView.addEventListener("loadingstatechanged", z._LoadingStateChanged.bind(z));
                    listView.itemTemplate = element.querySelector(".notetemplate");
                    return Data.GetById(options.item.id, "notes");
                })
                .then(function (note) {
                    NoteDes = note;
                    NoteDes.type = options.item.type;
                    z._initializeLayout(Windows.UI.ViewManagement.ApplicationView.value);
                    z._initializeUI();
                });
        },

        unload_: function () {
            // TODO: 响应导航到其他页。
            clearInterval(Timer);
            var NavBar = document.getElementById("NavBar").winControl;
            NavBar.hide();
            var AppBar = document.getElementById("AppBar").winControl;
            AppBar.hide();
            this._SaveNote().then(function (time) {
                WinJS.Navigation.back();
            });
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = document.querySelector('#NoteList').winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler, false);
                    //var firstVisible = listView.indexOfFirstVisible;
                    //this._initializeLayout(listView, viewState);
                    //if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                    //    listView.indexOfFirstVisible = firstVisible;
                    //}

                    this._initializeLayout(viewState);
                }
            }
        },

        /*init UI*/

        _initializeLayout:function(viewState){
            var listView = document.querySelector('#NoteList').winControl;
            
            listView.itemDataSource = GroupedNotes.dataSource;
            listView.itemTemplate = this._ListTemplateRenderer;
            listView.layout = new WinJS.UI.ListLayout();
            listView.indexOfFirstVisible = cIndex_;
            
            this.addNoteCount();
        },

        _initializeUI: function (element) {

            this._bindAppBarCmd();
            this._initNoteContent(true);
            this.BindNoteChange();
            this.BindPageEvent();
            this._bindShare();
            this._printinit();
        },

        _bindShare: function () {
            if (flag == 0) {
                flag = 1;
                Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().addEventListener("datarequested", function (e) {
                    if (WinJS.Navigation.location != "/Pages/Note/Note.html") return;
                    var request = e.request;
                    var title = $("#Note_header").text();
                    if (title.length < 1) title = " ";
                    request.data.properties.title = title;
                    request.data.properties.description = "Share from QuickNote";
                    var content = $("#Note_Content").html();
                    if (content.length < 1) content = '<div></div>';
                    var text = Util.FormatToCleanText(content, true);
                    content = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.createHtmlFormat(content);
                    request.data.setText(text);
                    request.data.setHtmlFormat(content);
                });
            }
        },

        _initNoteContent: function (isfrist) {
            var z = this;
            if (isfrist) {
                z._fillcontent();
            } else {
                WinJS.UI.Animation.exitContent([Note_header, Note_tags, Note_updated, Note_Content, note_tag], null).done(function () {

                    //NoteMainContent.style.display = "none";
                    z._fillcontent();
                    //NoteMainContent.style.display = "-ms-grid";

                    return WinJS.UI.Animation.enterContent([Note_header, Note_tags, Note_updated, Note_Content, note_tag], null);

                });
            }
            
        },

        _fillcontent: function () {
            var z = this;
            document.querySelector('.pagetitle').textContent = NoteDes.title;
            document.querySelector("#Note_id").textContent = NoteDes.id;
            document.querySelector("#Note_header").textContent = NoteDes.title;
            document.querySelector("#Note_Content").innerHTML = NoteDes.content.length > 0 ? window.toStaticHTML(NoteDes.content) : "";
            document.querySelector("#Note_tags").textContent = NoteDes.tag;
            document.querySelector("#Note_updated").textContent = Util.UTCtoLocalDate(NoteDes.updated);
            document.querySelector('section[role=main]').style.backgroundColor = NoteDes.color.length > 1 ? NoteDes.color : "rgb(255, 252, 196)";
            document.querySelector('.notebodytop').style.backgroundColor = NoteDes.color.length > 1 ? NoteDes.color : "rgb(255, 252, 196)";
            document.querySelector('.note_des').style.backgroundColor = NoteDes.color.length > 1 ? NoteDes.color : "rgb(255, 252, 196)";
            document.querySelector("#cmdColor .win-commandimage").style.color = NoteDes.color.length > 1 ? NoteDes.color : "rgb(255, 252, 196)";
            $("#color_select_area button.select").removeClass("select");
            document.querySelector("#" + z.getColorId(NoteDes.color)).className = "select";
            this._updatecmdPin();
            if (NoteDes.title == "New Note" || NoteDes.title == "") {
                $('#Note_header').addClass('new');
            } else {
                $('#Note_header').removeClass('new');
            }
            if (NoteDes.type == 'newnote') {
                //$('#Note_Content').focus();
            }
        },
        /*for print*/
        _printinit:function(){
            var printManager = Windows.Graphics.Printing.PrintManager.getForCurrentView();
            printManager.onprinttaskrequested = this._onPrintTaskRequested;
        },

        _onPrintTaskRequested:function(printEvent){
            printEvent.request.createPrintTask("Quick Note", function (args) {
                args.setSource(MSApp.getHtmlPrintDocumentSource(document));

            });
        },


        /*List Action*/

        _oncontentanimating: function (args) {
            Util.debug("contentanimating ", args.detail.type);
        },

        _LoadingStateChanged: function (args) {
            //if (ListLoadingFlag) return;
            //var listView = document.querySelector('#NoteList').winControl;
            //Util.debug("in loadingstatechagned ",listView.loadingState);
            //if (listView.loadingState == "complete") {
            //    listView.ensureVisible(currentIndex);
            //    ListLoadingFlag = true;
            //}
            
        },

        addNoteCount: function () {
            if ($("#notecount").length == 0) {
                var notecount = document.createElement("div");
                notecount.innerHTML = window.toStaticHTML("<div class='count'>" + GroupedNotes.length + " Notes</div>");
                $(notecount).attr({ 'id': "notecount" }).appendTo("div.win-viewport");
            } else {
                $("#notecount .count").text(GroupedNotes.length + " Notes");
            }
        },

        _reFocusList: function (index, isfirst,issetTimeOut) {
            //TODO:this function has some bug ,probably with the listview animation
            var z = this;
            var listView = document.querySelector('#NoteList').winControl;
            var ele = listView.elementFromIndex(index);
            
            if (!ele) {
                index = 0;
                var ele = listView.elementFromIndex(0);
                
            }
            if (index == 0) listView.indexOfFirstVisible = 0;
            var item = GroupedNotes.getItem(index);
            if (isfirst) item = GroupedNotes.getItem(0);
            clearInterval(Timer);
            currentIndex = index;
            $('.item-overlay.select').removeClass("select");
            ele && (ele.querySelector(".item-overlay").className = "item-overlay select");
            
            Data.GetById(item.data.id, "notes").then(function (note) {
                NoteDes = note;
                z._initNoteContent();
                z._SaveTimerInit();
            });

            if (issetTimeOut) {
                setTimeout(function () {
                    var ele = listView.elementFromIndex(index);
                    if (!ele) {
                        index = 0;
                        var ele = listView.elementFromIndex(0);
                    }
                    if (index == 0) listView.indexOfFirstVisible = 0;
                    $('.item-overlay.select').removeClass("select");
                    ele.querySelector(".item-overlay").className = "item-overlay select";
                }, 500);
            }
            
        },

        _itemInvokd: function (args) {
            var z = this;
            var listView = document.querySelector('#NoteList').winControl;
            this._SaveNote()
                .then(function (time) {
                    clearInterval(Timer);
                    return args.detail.itemPromise;
                })
                .then(function (item) {
                    var ele = listView.elementFromIndex(item.index);
                    currentIndex = item.index;
                    $('.item-overlay.select').removeClass("select");
                    ele.querySelector(".item-overlay").className = "item-overlay select";

                    Data.GetById(item.data.id, "notes").then(function (note) {
                        NoteDes = note;
                        z._initNoteContent();
                        z._SaveTimerInit();
                    });


                });
        },

        _ListTemplateRenderer:function(itemPromise){
            var z = this;
            return itemPromise.then(function (currentItem) {
                var content;
                content = document.querySelector(".notetemplate");
                var result = content.cloneNode(true);
                result.attributes.removeNamedItem("data-win-control");
                result.attributes.removeNamedItem("style");
                result.style.overflow = "hidden";
                result.querySelector(".item-overlay").style.borderLeft = "6px solid " + Util.getColorFromId(Util.getColorId(currentItem.data.color))[1];
                if (currentItem.data.id == NoteDes.id) {
                    currentIndex = currentItem.index;
                    result.querySelector(".item-overlay").className = "item-overlay select";
                }
                result.querySelector(".item-title").textContent = currentItem.data.title;
                result.querySelector(".item-content").textContent = Util.FormatToCleanText(currentItem.data.content);
                result.querySelector(".item-date").textContent = currentItem.data.updated_;
                return result;
            });
        },


        /*Appbar*/

        _bindAppBarCmd: function () {
            document.getElementById('cmdPin').addEventListener('click', this.doClickPin.bind(this), false);
            document.getElementById('cmdColor').addEventListener("click", this.doClickColor.bind(this), false);
            document.getElementById('cmdDelete').addEventListener("click", this.doClickDelete.bind(this), false);
            document.getElementById('cmdAdd').addEventListener("click", this.doClickAdd.bind(this), false);
            $('#color1,#color2,#color3,#color4,#color5,#color6,#color7').click(this.doColorSelectClick.bind(this));
            this._updatecmdPin();
        },

        doClickAdd: function () {
            var z = this;
            Data.addNote({ title: "New Note" })
                .then(function (id) {
                    return Data.GetById(id, "notes");
                })
                .then(function (note) {
                    note.key = Util.getLocalFormatDateFromUTCInt(note.updated, 1);
                    note.updated_ = Util.getLocalFormatDateFromUTCInt(note.updated, 4);
                    note.updated = Util.getLocalFormatDateFromUTCInt(note.updated, 2);
                    GroupedNotes.unshift(note);
                    z.addNoteCount();
                    //TODO:will refocus the new item;
                    //GroupedNotes.notifyReload();
                    z._reFocusList(0,true,true);
                });
        },

        doClickDelete:function(){
            var listView = document.querySelector('#NoteList').winControl;
            var z = this;
            var index = listView.indexOfElement(document.querySelector("#NoteList .item-overlay.select"));
            if (index < 0) return;
            Util.debug("Ready to Delete item's index: ", index);
            var item = GroupedNotes.getItem(index);
            Data.MoveNotesToList([item.data.id], "trash").then(function () {
                GroupedNotes.splice(index, 1);
                z.addNoteCount();
                if (index == 0) {
                    if (GroupedNotes.length == 0) {
                        z.doClickAdd();
                    } else {
                        z._reFocusList(1, true);
                    }
                } else {
                    z._reFocusList(index-1);
                }
            });
        },

        

        doClickColor: function () {
            var color_select_area = document.getElementById("color_select_area").winControl;
            color_select_area.show("cmdColor", "top", "center");
        },

        doClickPin: function () {
            var z = this;
            document.getElementById('AppBar').winControl.sticky = true;
            document.getElementById("NavBar").winControl.sticky = true;
            if (WinJS.UI.AppBarIcon.unpin === document.getElementById("cmdPin").winControl.icon) {
                Util.unPinByTileID("QuickNote.ID_" + NoteDes.id, document.getElementById("cmdPin").getBoundingClientRect()).then(function (isDelete) {
                    z._updatecmdPin();
                });
            } else {
                Util.PinByDescription(NoteDes, document.getElementById("cmdPin").getBoundingClientRect()).then(function (isCreated) {
                    z._updatecmdPin();
                });
            }
        },

        doColorSelectClick: function (e) {
            var listView = document.querySelector('#NoteList').winControl;
            document.querySelector("#color_select_area button.select").removeAttribute("class");
            document.getElementById(e.target.id).className = "select";
            document.querySelector("#cmdColor .win-commandimage").style.color = this.getColorFromId(e.target.id)[0];
            document.querySelector('section[role=main]').style.backgroundColor = this.getColorFromId(e.target.id)[0];
            document.querySelector('.notebodytop').style.backgroundColor = this.getColorFromId(e.target.id)[0];
            document.querySelector('.note_des').style.backgroundColor = this.getColorFromId(e.target.id)[0];
            var ele = listView.elementFromIndex(currentIndex);
            ele.querySelector(".item-overlay").style.borderLeftColor = this.getColorFromId(e.target.id)[1];
        },

        getColorFromId: function (colorid) {
            return Util.getColorFromId(colorid);
        },

        getColorId: function (color) {
            return Util.getColorId(color);
        },
        _updatecmdPin: function () {
            var TileID = "QuickNote.ID_" + NoteDes.id;
            var PinControl = document.getElementById("cmdPin").winControl;
            if (Windows.UI.StartScreen.SecondaryTile.exists(TileID)) {
                PinControl.label = "Unpin from Start";
                PinControl.icon = "unpin";
                PinControl.tooltip = "Unpin from Start";
            } else {
                PinControl.label = "Pin to Start";
                PinControl.icon = "pin";
                PinControl.tooltip = "Pin to Start";
            }
            document.getElementById('AppBar').winControl.sticky = false;
            document.getElementById("NavBar").winControl.sticky = false;
        },

        
        /*Bind Page event*/

        BindPageEvent: function () {
            document.getElementById("usedefine").addEventListener("click", this.unload_.bind(this), false);
            var inputPane = Windows.UI.ViewManagement.InputPane.getForCurrentView();
            inputPane.addEventListener("showing", this.keyboardShowing, false);
            inputPane.addEventListener("hiding", this.keyboardhidingHandler, false);

        },

        /*Keyboard Event*/

        keyboardShowing: function (e) {
            if (WinJS.Navigation.location != "/Pages/Note/Note.html") return;
            e.ensuredFocusedElementInView = true;
            var keyboardRect = e.occludedRect;
            if (hidingAnimation) {
                hidingAnimation = hidingAnimation.cancel();
                hidingAnimation = null;
            }
            //var elementToAnimate = document.getElementById("NoteMainContent");
            var elementToAnimate = document.querySelector("#NoteMainContent");
            var elementToResize = document.querySelector(".Note");
            //var elementToResize2 = document.querySelector
            displacement = keyboardRect.height;
            var displacementString = -displacement + "px";

            showingAnimation = Keyboard.Animations.inputPaneShowing(elementToAnimate, { height: keyboardRect.y, left: "0px", top: "0px" }).then(function () {

                // After animation, layout in a smaller viewport above the keyboard
                elementToResize.style.height = keyboardRect.y + "px";
                // Scroll the list into the right spot so that the list does not appear to scroll
                showingAnimation = null;
            });
        },

        keyboardhidingHandler: function (keyboardRect) {
            if (WinJS.Navigation.location != "/Pages/Note/Note.html") return;
            if (showingAnimation) {
                showingAnimation.cancel();
                showingAnimation = null;
            }
            if (displacement > 0) {
                var elementToAnimate = document.querySelector("#NoteMainContent");
                var elementToResize = document.querySelector(".Note");
                var displacementString = -displacement + "px";
                displacement = 0;
                if (!elementToAnimate || !elementToResize) return;
                elementToResize.style.height = "";
                elementToAnimate.style.transform = "translate(0px," + displacementString + ")";
                hidingAnimation = Keyboard.Animations.inputPaneHiding(elementToAnimate, { left: "0px", top: "0px" }).then(function () {
                    elementToAnimate.style.transform = "";
                });
            }
        },


        /*Note change event*/

        BindNoteChange: function () {
            

            $('#Note_tags').on(this._TagEvent);
            $("#Note_header").on(this._NoteheaderEvent);
            $("#Note_Content").on(this._NoteContentEvent);

            this._SaveTimerInit();
        },

        UpdateListViewContent: function () {
            var ele = $('.item-overlay.select')[0];
            if (ele) {
                ele.querySelector(".item-title").textContent = $("#Note_header").text();
                ele.querySelector(".item-content").textContent = Util.FormatToCleanText($("#Note_Content").html());
            }

        },

        _TagEvent: {
            keypress:function(e){
                if (e.which == 13) {
                    e.preventDefault();
                }
            },
            keyup: function (e) {
                Util.info('Tag change');
                //if(e.keyCode ==
            },
            paste: function (e) {
                var char = $(this).get_charof();
                var z = this;
                var dataPackageView = Windows.ApplicationModel.DataTransfer.Clipboard.getContent();
                if (dataPackageView.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                    dataPackageView.getTextAsync().done(function (text) {
                        var result = char[0] + text.toString().replace(/\r|\n/g, '') + char[1];
                        z.innerText = result;
                        //$(z).restoreRange((char[0] + text).length, true);
                    });
                }
                e.preventDefault();
            }
        },

        _NoteheaderEvent: {
            keypress: function (e) {
                if (e.which == 13) {
                    e.preventDefault();
                }
            },
            keyup: function (e) {
                Util.info("Note header changed");
                document.querySelector('.pagetitle').textContent = $(this).text();
                document.querySelector(".pagecontrol").winControl.UpdateListViewContent();
                $(this).removeClass('new');
                
            },
            paste: function (e) {
                var char = $(this).get_charof();
                var z = this;
                var dataPackageView = Windows.ApplicationModel.DataTransfer.Clipboard.getContent();
                if (dataPackageView.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                    dataPackageView.getTextAsync().done(function (text) {
                        var result = char[0] + text.toString().replace(/\r|\n/g, '') + char[1];
                        z.innerText = result;
                        //$(z).restoreRange((char[0] + text).length, true);
                    });
                }
                e.preventDefault();
            }
        },

        _NoteContentEvent: {
            keypress: function (e) {
                if (e.which == 13) {
                    $('#Note_header').removeClass('new');
                }
            },
            keyup: function (e) {
                if ($('#Note_header').hasClass('new')) {
                    var content = $(this).text();
                    var title = content.length > 60 ? content.substr(0, 60) : content;
                    document.querySelector('.pagetitle').textContent = title;
                    document.querySelector('#Note_header').textContent = title;
                }
                document.querySelector(".pagecontrol").winControl.UpdateListViewContent();
            },
            paste: function (e) {
                //var char = $(this).get_charof();
                //var z = this;
                //var dataPackageView = Windows.ApplicationModel.DataTransfer.Clipboard.getContent();
                //if (dataPackageView.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                //    dataPackageView.getTextAsync().done(function (text) {
                //        var result = char[0] + text.toString().replace(/\r|\n/g, ' ') + char[1];
                //        z.innerText = result;
                //        //$(z).restoreRange((char[0] + text).length, true);
                //    });
                //}
                //e.preventDefault();
                setTimeout(function (a) {
                    Util.debug(a.innerHTML);
                    a.innerHTML =window.toStaticHTML(wysihtml5.dom.parse(a.innerHTML, wysihtml5ParserRules));
                },0,this);
            }
        },
        
        _TriggerSaveNote: function () {
            this._SaveNote();
        },

        _SaveTimerInit: function () {
            clearInterval(Timer);
            Timer = setInterval(this._TriggerSaveNote.bind(this), 5000);
        },
        /*Save Data*/

        _SaveNote: function () {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                
                var content = $("#Note_Content").html();
                var title = $("#Note_header").text();
                var tag = $('#Note_tags').text();
                var color = z.getColorFromId($("#color_select_area button.select").attr("id"))[0];
                var note = {
                    id: NoteDes.id,
                    tag: tag || '',
                    color: color,
                    content: content||" ",
                    title:title
                }
                if (NoteDes.tag == tag && NoteDes.color == color && NoteDes.content == content && NoteDes.title == title) {
                    var time = Util.getUTCInt('now');
                    Util.info("Nothing to update at ", Util.UTCtoLocalDate(time) + " " + Util.UTCtoLocalTime(time));
                    comp(time);  // return the saved time;
                } else {
                    Data.UpdateNote(note).then(function (e) {
                        var time = Util.getUTCInt('now');
                        Util.info("Update note at ", Util.UTCtoLocalDate(time) + " " + Util.UTCtoLocalTime(time));
                        Util.UpdateTileNotification("QuickNote.ID_" + NoteDes.id, NoteDes);
                        comp(time);  // return the saved time;
                    });
                }
            });
        }


    });
})();
