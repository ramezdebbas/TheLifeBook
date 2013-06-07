// 有关“共享协定”模板的简介，请参阅以下文档:
// http://go.microsoft.com/fwlink/?LinkId=232513
//
// TODO: Edit the manifest to enable use as a share target.  The package 
// manifest could not be automatically updated.  Open the package manifest file
// and ensure that support for activation of sharing is enabled.

(function () {
    "use strict";

    var app = WinJS.Application;
    var share;

    function onShareSubmit() {
        //document.querySelector(".progressindicators").style.visibility = "visible";
        //document.querySelector(".commentbox").disabled = true;
        document.querySelector("#submit").disabled = true;

        var content = document.querySelector("#Note_Content").innerHTML;
        var title = document.querySelector("#Note_header").textContent;
        var tag = document.querySelector("#Note_tags").textContent || "";
        Data.init()
            .then(function () {
                return Data.addNote({
                    title: title,
                    tag: tag,
                    content: content,
                    color: '#fffcc4'
                });
            })
            .then(function (note) {
                Windows.Storage.ApplicationData.current.signalDataChanged(); 
                share.reportCompleted();
            })
        


        
    }

    function TextToHTML(str) {
        str = str.replace(/\r/g, '');
        str = str.replace(/\n/g, '<br />');
        return str;
    } 

    // 此功能响应所有应用程序激活。
    app.onactivated = function (args) {
        var thumbnail;

        if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.shareTarget) {
            document.querySelector("#submit").onclick = onShareSubmit;
            share = args.detail.shareOperation;

            if(share.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)){
                share.data.getTextAsync().then(function (text) {
                    var title = share.data.properties.title;
                    Util.debug(share.data.properties.Application);
                    if (share.data.properties.Application == "Internet Explorer") {
                        if (title.slice(0, 13) == "Content from ") {
                            title = title.slice(13, title.length);
                        }
                    }
                    document.querySelector("#Note_header").textContent = title;
                    document.querySelector("#Note_Content").innerHTML = window.toStaticHTML(share.data.properties.description + "<br />" + TextToHTML(text));
                });
            }
            
        }
    };

    app.start();
})();
