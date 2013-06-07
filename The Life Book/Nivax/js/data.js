; (function () {
    /*
        Data format:
        -"notes":
        |------   |-------|----------|-------|-------|--------|----- |--------|-----------|-----------|----------| 
        |   id    |  title |  content |  url  |  list |  topic |  tag |  color |   created |   updated |  user_id |
        |------- |--------|----------|-------|-------|--------|------|--------|-----------|-----------|----------| 
          



    */

    WinJS.Namespace.define("Data", {
        db: null,
        getObjectStore: function (name, mode) {
            var s = this.db.transaction([name], (mode == 1 ? 'readwrite' : 'readonly')).objectStore(name);
            return s;
        },

        getUserId:function(){
            return localStorage['diigo']?JSON.parse(localStorage['diigo']).user_id:0;
        },

        /*init database*/
        openDatabase: function () {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {

                var request = indexedDB.open('quicknote', 2); //Update the database;
                Util.info("open database...");
                request.onsuccess = function (e) {
                    z.db = e.target.result;
                    comp();
                };

                request.onupgradeneeded = function (e) {
                    z.db = e.target.result;
                    if (!z.db.objectStoreNames.contains("notes")) {
                        Util.info("create objectstore [notes]");
                        var store = z.db.createObjectStore("notes", { keyPath: 'id', autoIncrement: true });
                        store.createIndex('updated', 'updated', { unique: false });
                        //store.createIndex('list', 'list', { unique: false });
                        //store.createIndex('topic', 'topic', { unique: false });
                    }
                };

                request.onerror = function (e) {
                    Util.error("open database error.", "[call from " + z.openDatabase.caller + "]", e.message);
                    err();
                }
            });
        },

        init: function () {
            var z = this;
            window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
            return new WinJS.Promise(function (comp, err, prog) {
                z.openDatabase().then(function () {
                    Util.info("open database successful");
                    comp();
                });
            });
        },

        /*=CURD==*/
        addNote: function (note) {
            var z = this;
            if (!note) note = {};
            return new WinJS.Promise(function (comp, err, prog) {
                var now = Util.getUTCInt("now");
                var request = z.getObjectStore("notes", 1).add({
                    title: note.title||"",
                    content: note.content || '',
                    url: '',
                    list: '',
                    topic: note.topic || '',
                    tag: note.tag || '',
                    color: note.color || "rgb(255, 252, 196)",
                    created: note.server_created_at || now,
                    updated: note.server_updated_at || now,
                    user_id: z.getUserId()
                });

                request.onsuccess = function (e) {
                    comp(e.target.result);
                }
                request.onerror = function (e) {
                    Util.error("Add note error. ", "[call from " + z.addNote.caller + "]", e.message);
                    err();
                }
            });

        },

        UpdateNote:function(note){
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                z.GetById(note.id, "notes").then(function (n) {
                    var request = z.getObjectStore("notes", 1).put({
                        id: note.id,
                        title: note.title || n.title,
                        content: note.content || n.content,
                        url: note.url||n.url,
                        list: (note.list === '') ? '' : note.list || n.list,
                        topic: note.topic || n.topic,
                        tag: note.tag || n.tag,
                        color: note.color || n.color,
                        created: n.created,
                        updated: Util.getUTCInt("now"),
                        user_id: note.user_id || z.getUserId()
                    });
                
                
                    request.onsuccess = function (e) {
                        comp(e.target.result);
                    }
                    request.onerror = function (e) {
                        Util.error("Update note error. ", "[call from " + z.UpdateNote.caller + "]", e.message);
                        err();
                    }
                });
            });
        },

        MoveNotesToList: function (ids,list) {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                for (var i = 0, len = ids.length; i < len; i++) {
                    z.UpdateNote({
                        id: ids[i],
                        list:list
                    });
                }
                comp();
            });
        },

        GetById: function (id, storename) {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                var request = z.getObjectStore(storename, 0).get(parseInt(id));
                request.onsuccess = function (e) {
                    comp(e.target.result);
                };
                request.onerror = function (e) {
                    Util.error("Get " + storename + " " + id + " Data error.", "[call from " + z.GetById.caller + "]", e.message);
                    err();
                }
            });
        },
        
        GetDataByKey_store: function (storename, keyindex, keyRange) {
            /*typeof keyRange == IDBKeyRange*/
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                var data = [], i = 0;
                var request = z.getObjectStore(storename, 0).index(keyindex).openCursor(keyRange);
                request.onsuccess = function (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        prog(i++);
                        cursor.continue();
                    } else {
                        comp(data);
                    }
                }
                request.onerror = function (e) {
                    Util.error("Get Data error.", "[call from " + z.GetDataByKey_store.caller + "]", "storename=" + storename + ",keyindex=" + keyindex + ",keyRange=" + keyRange, e.message);
                    err();
                }
            });
        },

        DeleteDataById: function (storename, id) {
            this.getObjectStore(storename, 1).delete(parseInt(id));
        },

        GetAllNotes: function () {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                var data = [], i = 0;
                var request = z.getObjectStore("notes", 0).openCursor();
                request.onsuccess = function (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        prog(i++);
                        cursor.continue();
                    } else {
                        comp(data);
                    }
                };

                request.onerror = function (e) {
                    Util.error("Get all data error.", "[call from " + z.GetAllNotes.caller + "]", e.message);
                    err();
                }

            });
        },
        /*=====*/

        getAllNotesByList: function (list,indexid) {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                var data = [], i = 0;
                var userID = z.getUserId();
                var index;
                var opencursor = z.getObjectStore("notes", 0).index("updated").openCursor();
                opencursor.onsuccess = function (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        if (cursor.value.list === list) {
                            if (!userID || (userID && cursor.value.user_id === userID)) {
                                data.push(cursor.value);
                                if (cursor.value.id == indexid) index = i;
                                prog(i++);
                            }
                        }
                        cursor.continue();
                    } else {
                        if (index!==undefined) data = [data, index];
                        comp(data);
                    }
                }

                opencursor.onerror = function (e) {
                    Util.error("Get " + list + " Data error.", "[call from " + z.getAllNotesByList.caller + "]", e.message);
                    err();
                }
            });
        },
        

        

        /*build the group data for the AllNotePage*/
        BuildDes:function(note){
            note.content =Util.FormatToCleanText(note.content).slice(0, 100);
            note.key = Util.getLocalFormatDateFromUTCInt(note.updated, 1);
            note.updated_ = Util.getLocalFormatDateFromUTCInt(note.updated, 4);
            note.updated = Util.getLocalFormatDateFromUTCInt(note.updated, 2);
            return note;
        },

        GetGroupKeyByDate:function(note){
            return note.key;
        },
        GetGroupDataByDate: function (note) {
            return {
                title:note.key
            }
        },
        compareGroupsByDate:function(left,right){
            if (left == 'Today') {
                left = Date.parse(new Date());
            } else {
                left = Date.parse(left + ' 1');
            }

            if (right == 'Today') {
                right = Date.parse(new Date());
            } else {
                right = Date.parse(right + ' 1');
            }
            return right - left;
        },

        getAllNotesDes: function (noNew,indexid) {
            /* if noNew is true, retrun data will not push the now note*/
            /* indexid for get the item index*/
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                z.getAllNotesByList("", indexid).then(function (notes) {
                    var index;
                    if (indexid) {
                        var index = notes[1];
                        notes = notes[0];
                    }
                    Util.debug("type ",typeof notes);
                    if (!noNew) {
                        notes.push({
                            title: 'New Note',
                            content: 'New Note',
                            color: 'rgba(255,255,255,.4)',
                            class: 'newnote',
                            updated: Util.getUTCInt('now')
                        });
                    }
                    notes = notes.reverse();
                    if (index!=undefined) index = notes.length - index;
                    var note_ = notes.map(z.BuildDes);
                    var list = new WinJS.Binding.List(note_);
                    var groupedData = list.createGrouped(z.GetGroupKeyByDate, z.GetGroupDataByDate, z.compareGroupsByDate);
                    if (index) groupedData = [groupedData, index];
                    comp(groupedData);
                });
            });
        },

        BuildDesForSearch: function (note) {
            note.title = note.title.replace(/>/g, '&gt;');
            note.title = note.title.replace(/</g, '&lt;');
            note.tag = note.tag.replace(/>/g, '&gt;');
            note.tag = note.tag.replace(/</g, '&lt;');
            note.content = Util.RemoveHTMLTag(note.content);
            note.key = Util.getLocalFormatDateFromUTCInt(note.updated, 1);
            note.updated = Util.getLocalFormatDateFromUTCInt(note.updated, 2);
            return note;
        },

        getAllNotesForSearch:function(){
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                z.getAllNotesByList("").then(function (notes) {
                    notes = notes.reverse();
                    notes.map(z.BuildDesForSearch);
                    var list = new WinJS.Binding.List(notes);
                    var groupedData = list.createGrouped(z.GetGroupKeyByDate, z.GetGroupDataByDate, z.compareGroupsByDate);
                    comp(groupedData);
                });
            });
        },
        /*Build data for trash page*/

        getTrashNotesDes: function () {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                z.getAllNotesByList("trash").then(function (notes) {
                    notes = notes.reverse();
                    notes.map(z.BuildDes);
                    var listdata = new WinJS.Binding.List(notes);
                    comp(listdata);
                });
            })

        },

        ClearTrash: function () {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                z.getAllNotesByList("trash").done(function (notes) {
                    for (var i = 0, len = notes.length; i < len; i++) {
                        z.DeleteDataById("notes", notes[i].id);
                    }
                    comp();
                });
            });
        },

        /*For Restore*/
        ClearNotes: function () {
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                var keyRange = IDBKeyRange.lowerBound(0, true);
                var request = z.getObjectStore("notes", 1).delete(keyRange);
                request.onsuccess=function(e){
                    comp();
                }
                request.onerror=function(e){
                    Util.error("Clear all Notes error.", "[call from " + z.ClearNotes.caller + "]", e.message);
                }
            });
        },

        RestoreByFile:function(noteArray){
            var z = this;
            return new WinJS.Promise(function (comp, err, prog) {
                z.ClearNotes()
                    .then(function () {
                        for(var i=1,len=noteArray.length;i<len;i++){
                            z.getObjectStore("notes", 1).add(noteArray[i]);
                        }
                        comp();
                    })
            });
        },



    });


})();