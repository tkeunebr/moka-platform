/**
*    Dependencies
*       jQuery
*/

var Moka = Moka || {};

/***************************************************************************
****************************************************************************
*   Communication Specification (JSON format)
*
*   WebSocket message structure
*
*       main structure
*       - type
*       - content       
*       types currently supported : addUser, removeUser, addItem, removeItem, moveItem, selectItem, unselectItem
*       example {type: "myType", content: "myContent"}
*
*       addUser message structure
*       - content : userId, name
*       example {type: "addUser, content: {userId: 12, name:"Vincent B."}}
*
*       removeUser message structure
*       - content : userId
*       example {type: "removeUser, content: {userId: 12}}
*
*       addItem message structure
*       - content : type, itemId, top, left
*       example {type: "addItem, content: {type: "umlClass", itemId: 7, top: 250, left: 350}}
*
*       removeItem message structure
*       - content : itemId
*       example {type: "removeItem, content: {itemId: 7}}
*
*       moveItem message structure
*       - content : itemId, top, left   
*       example {type: "moveItem, content: {itemId: 7, top: 250, left: 433}}
*
*
*       resizeItem message structure
*       - content : itemId, width, height
*       example {type : "resizeItem", content: {itemId: 7, width: 120, height: 200}}
*
*       selectItem message structure
*       - content : userId, itemId
*       example {type: "selectItem", content: {userId: 12, itemId: 7}}
*
*       unselectItem message structure
*       - content : userId
*       example {type: "unselectItem", content: {userId: 12}}
*
*
*
****************************************************************************
****************************************************************************/

/*
*   The different values used within the platform
*/
Moka.platformConfiguration = (function(){
    "use strict";
    return {
        host_ip                 :   "localhost",
        port                    :   "8887",
        userContainerCssId      :   "userInfoContainer",
        itemContainerCssId      :   "playground",
        statusCssId             :   "platformTextStatus",
        iconCssId               :   "platformIconAction",
        saveCssId               :   "platformIconSave",
        cancelIcon              :   "./images/cancel_icon.png",
        connectionIcon          :   "./images/connection_icon.png",
        rotatingCssClass        :   "rotationAnimation",
        messageType             :   {
            addUser         :   "addUser",
            removeUser      :   "removeUser",
            addItem         :   "addItem",
            removeItem      :   "removeItem",
            moveItem        :   "moveItem",
            resizeItem      :   "resizeItem",
            selectItem      :   "selectItem",
            unselectItem    :   "unselectItem",
            saveWorkSpace   :   "saveWorkSpace",
        },
        userColors              :   [
            "#FF7C7C",
            "#70CBED",
            "#B7DB4C",
            "#FFCF70",
            "#C394DB"                
        ],
        
    };
})();

/*
*   The different values used within the itemFactory
*/
Moka.itemFactoryConfiguration = (function(){
    "use strict";
    return {
        itemCssClass                :   "item",
        itemPrefixId                :   "item_",
        itemContentClass            :   "itemContent",
        itemContributionsClass      :   "itemContributions",
        itemContentTitleClass       :   "itemContentTitle", 
        postItType                  :   "post-it",
        postItTitle                 :   "Post-it",
        postItContentClass          :   "postItContent",
        postItContent               :   "Here goes your note [...]",
        umlClassType                :   "umlClass",
        umlClassContentClass        :   "umlContent",
        umlClassContentTitleClass   :   "umlTitle",
        umlAttributesClass          :   "umlAttributes",
        umlAttributeClass           :   "umlAttribute",
        umlMethodsClass             :   "umlMethods",
        umlMethodClass              :   "umlMethod",
        umlTitle                    :   "Uml Class",
        pictureType                 :   "image", 
        pictureContentClass         :   "img-fill-div",
        pictureTitle                :   "Picture",
        defaultPictureSrc           :   "./images/default_picture.gif",
    };
})();

/*
*   The different values used within the User module
*/
Moka.userConfiguration = (function(){
    "use strict";
    return {
        userInfoCssClass            :   "userInfo",
        userInfoContentCssClass     :   "userInfoContent",
        userInfoPerCentCssClass     :   "userInfoPerCent",
        userInfoColorCssClass       :   "userInfoColor",
        
    };
})();

Moka.platform = (function(configuration){
    "use strict";
    
    //private properties & methods
    var webSocket;
    var userList = [];
    var userContainer = $("#"+configuration.userContainerCssId);
    var itemList = [];
    var itemContainer = $("#"+configuration.itemContainerCssId);
    var status = "disconnected";
    
    /*
    *   Private Methods
    *
    *   onWebSocketOpen
    *   onWebSocketClose
    *   onWebSocketMessage
    *   onWebSocketError
    *   addUser
    *   removeUser
    *   getUserById
    *   addItem
    *   removeItem
    *   getItemById
    */    
    
    var onWebSocketOpen = function(event){
        console.log("open");
        status = "connected";
        userList = [];
        itemList = [];
        userContainer.empty();
        itemContainer.empty();
        $("#"+configuration.statusCssId).text("Connected");
        $("#"+configuration.iconCssId).attr("src", configuration.cancelIcon);
        $("#"+configuration.iconCssId).removeClass(configuration.rotatingCssClass);
    };
    
    var onWebSocketClose = function(event){
        console.log("close");
        status = "disconnected";
        $("#"+configuration.statusCssId).text("Disconnected");
        $("#"+configuration.iconCssId).attr("src", configuration.connectionIcon);
        $("#"+configuration.iconCssId).removeClass(configuration.rotatingCssClass);
    };
    
    var onWebSocketMessage = function(event){
        try {
            processMessage(eval("("+event.data+")"));
        } catch (syntaxError) {
            console.log(syntaxError.message);
            console.log("Not a valid JSON message :" + event.data);
        }
    };
    
    var onWebSocketError = function(event){
        console.log("error");
    }; 
    
    
    
    var addUser = function(id, name){
        if(getUserById(id) != null) return false;
        var color = configuration.userColors[userList.length];
        var newUser = new Moka.User(id, name, color);
        userList.push(newUser);
        userContainer.append(newUser.getUserInfo());
        return true;
    }; 

    var saveWorkSpace = function(workSpace){
        var data = "data:application/octet-stream,";
        data+=workSpace;
        window.open(data);
    }
    
    var processMessage = function(message){
        var messageContent = message.content;
        var messageTypes = configuration.messageType;
        
        switch(message.type){        
            case messageTypes.addUser :
                addUser(messageContent.userId, messageContent.name);
                break;
                
            case messageTypes.removeUser :
                removeUser(messageContent.userId);
                break;
            
            case messageTypes.addItem :
                addItem(messageContent.type, messageContent.itemId, messageContent.top, messageContent.left);
                break;

            case messageTypes.removeItem :
                removeItem(messageContent.itemId);
                break;

            case messageTypes.moveItem :
                moveItem(messageContent.itemId, messageContent.top, messageContent.left);
                break;

            case messageTypes.resizeItem :
                resizeItem(messageContent.itemId, messageContent.width, messageContent.height);
                break;

            case messageTypes.selectItem :
                selectItem(messageContent.userId, messageContent.itemId);
                break;
                
            case messageTypes.unselectItem :
                unselectItem(messageContent.userId);
                break;
                
            case messageTypes.saveWorkSpace :
                saveWorkSpace(JSON.stringify(messageContent));
                break;
                
            default:
                console.log("unsupported message: " + message);
                console.log(message);
                break;
        };
    };
    
    var unselectItem = function(userId){
        var userSearch = getUserById(userId);
        if(userSearch != null){
            userSearch.user.unselectItem();
        }
    };
    
    var selectItem = function(userId, itemId){
        var itemRes = getItemById(itemId);
        var userRes = getUserById(userId);
        if(itemRes != null && userRes != null){
            userRes.user.selectItem(itemRes.item);
        }
    };
    
    var getUserById = function(id){
        var userListLength = userList.length;
        for(var i=0; i< userListLength; i++){ 
            if(userList[i].getId() === id) return {index: i, user: userList[i]};
        }
        return null;
    };
    
    var removeUser = function(id){
        var temp = getUserById(id);
        if(temp != null){
            temp.user.getUserInfo().remove();
            userList.splice(temp.index, 1);
        }
    };
    
    var addItem = function(type, id, top, left){
        if(getItemById(id) != null) return false;
        var temp = Moka.itemFactory.createItem(type, id);
        if(temp != null){
            itemList.push(temp);
            itemContainer.append(temp.jQueryObject);
            temp.move(top, left);
        }
        return true;
    };
    
    var getItemById = function(id){
        var itemListLength = itemList.length;
        for(var i=0; i< itemListLength; i++){
            if(itemList[i].getId() === id) return {index: i, item: itemList[i]};
        }
        return null;
    };
    
    var removeItem = function(id){
        var temp = getItemById(id);
        if(temp != null){
            temp.item.jQueryObject.remove();
            itemList.splice(temp.index, 1);
        }
    };
    
    var moveItem = function(id, top, left){
        var temp = getItemById(id);
        if(temp != null){
            temp.item.move(top, left);
        }
    };

    var resizeItem = function(id, width, height){
        var temp = getItemById(id);
        if(temp != null){
            temp.item.resize(width, height);
        }
    }
    
    
    /*
    *   MokaPlatform Constructor
    */
    var MokaPlatform = function(){
        var these = this;
        $("#"+configuration.iconCssId).bind("click", function(){
            if(status === "disconnected") {                
                these.run();
            } else if (status === "connected") {
                these.close();
            }
        });
        
        $("#"+configuration.saveCssId).bind("click", function(){
            if(status === "connected") {
                askToSaveWorkSpace();
            }            
        });
    };
    
    var askToSaveWorkSpace = function() {
        webSocket.send("askToSave");
    };
    
    //public API -- methods
    MokaPlatform.prototype = {      
        
        setHostIp : function(ip){
            configuration.host_ip = ip;
        },
        
        setPort : function(port){
            configuration.port = port;
        },
        
        run : function(){
            status = "connecting";
            $("#"+configuration.statusCssId).text("Connecting");
            $("#"+configuration.iconCssId).attr("src", configuration.connectionIcon);
            $("#"+configuration.iconCssId).addClass(configuration.rotatingCssClass);
            
            //<3 rotation effect, let's spin for at least 1.5sec
            setTimeout(function(){
                webSocket = new WebSocket('ws://'+configuration.host_ip+':'+configuration.port);            
                webSocket.onopen    = function(event){ onWebSocketOpen(event);      };            
                webSocket.onclose   = function(event){ onWebSocketClose(event);     };            
                webSocket.onmessage = function(event){ onWebSocketMessage(event);   };            
                webSocket.onerror   = function(event){ onWebSocketError(event);     }; 
            }, 1500);
                  
        },
        
        close : function(){
            status = "disconnected";
            webSocket.close();
        },
        
        //TODO remove
        processMessage : processMessage,
    };
    
    return MokaPlatform;    
})(Moka.platformConfiguration);

/*
*   Moka.User
*/
Moka.User = (function(configuration){
    "use strict";    
    
    var initUserInfo = function(id, name, color){
        var userInfo = $('<div class="'+configuration.userInfoCssClass+'" id="user_'+id+'" />');
        var userInfoContent = $('<div class="'+configuration.userInfoContentCssClass+'" />');
        userInfoContent.append($('<span class="'+configuration.userInfoPerCentCssClass+'">00%</span>'));
        userInfoContent.append(" "+name);
        userInfo.append(userInfoContent);
        userInfo.append($('<div class="'+configuration.userInfoColorCssClass+'" style="background-color: '+color+'" />'));
        return userInfo;
    };
    
    //constructor
    var User = function(id, name, color){
        this.color = color;
        var userInfo = initUserInfo(id, name, color);
        this.selection = null;
        this.getId = function(){ return id; }; 
        this.getName = function(){ return name; };
        this.getUserInfo = function(){ return userInfo; };
    };  
    
    User.prototype = {
    
        selectItem : function(item){
            if(this.selection === null){
                this.selection = $('<div class="itemContribution"/>');
                this.selection.css("background-color", this.color);
                item.getContributions().append(this.selection);
            }            
        },
        
        unselectItem : function(){
            this.selection.remove();
            this.selection = null;
        },
    };
    
    return User;    
})(Moka.userConfiguration);



/*
*
*   A naive factory that creates elements for our platform
*
*/
Moka.itemFactory = (function(configuration){
    "use strict";
    
    /*
    *   Item Constructor
    */
    var Item = function(id){
        this.jQueryObject;
        this.getId = function(){ return id; };
    };
    
    Item.prototype = { 
    
        /*
        *   Initialize the jQueryObject
        */
        init : function(jQueryObject){
            if(jQueryObject){
                this.jQueryObject = jQueryObject;
            }else{
                this.jQueryObject = $('<div id="'+configuration.itemPrefixId+this.getId()+'"class="'+configuration.itemCssClass+'"/>');
                this.jQueryObject.append($('<div class="'+configuration.itemContentClass+'"/>')
                    .append('<div class="'+configuration.itemContentTitleClass+'" />'));
                this.jQueryObject.append($('<div class="'+configuration.itemContributionsClass+'"/>')); 
            }                   
        },
        
        /*
        *   Retrieve the "Content" division as a jQueryObject
        */
        getContentObject : function(){
            return this.jQueryObject.find("."+configuration.itemContentClass);
        },
        
        /*
        *   Retrieve the "ContentTitle" division as a jQueryObject
        */
        getContentTitleObject : function(){
            return this.jQueryObject.find("."+configuration.itemContentTitleClass);
        },
        
        /*
        *   Retrieve the "Contributions" division as a jQueryObject        
        */
        getContributions : function(){
            return this.jQueryObject.find("."+configuration.itemContributionsClass);
        },
        
        /*
        *   Set the title of the Item
        *
        *   @Param title
        */
        setTitle : function(title){
            this.getContentTitleObject().text(title);
        },
        
        /*
        *   Move the item 
        *
        *   @Param top
        *   @Param left
        */
        move : function(top, left){
            this.jQueryObject.css("top", top+"px");
            this.jQueryObject.css("left", left+"px");
        },

        /*
        *   Resize the item
        *
        *   @Param width
        *   @Param height
        */
        resize : function(width, height){
            this.jQueryObject.css("width", width+"px");
            this.jQueryObject.css("height", height+"px");
        }
        
    };
    
    /*
    *   Post-It Item Constructor
    *       extends Item
    */
    var PostItItem = function(id){
        Item.call(this, id);
    };
    
    PostItItem.prototype = new Item();
    
    /*
    *   Initialize the jQueryObject
    */
    PostItItem.prototype.init = function(jQueryObject){
        if(jQueryObject){
            this.jQueryObject = jQueryObject;
        }else{
            Item.prototype.init.call(this, null);
            this.getContentObject().append($('<p class="'+configuration.postItContentClass+'" />'));
        }        
    };
    
    /*
    *   Set the text of the Post-It
    *
    *   @Param text
    */
    PostItItem.prototype.setText = function(text){
        this.jQueryObject.find('.'+configuration.postItContentClass).text(text);
    };
    
    /*
    *   Uml Class Item Constructor
    *       extends Item
    */
    var UmlClassItem = function(id){
        Item.call(this, id);
        this.attributes = [];
        this.methods = [];
    };
    
    UmlClassItem.prototype = new Item();
    
    /*
    *   Initialize the jQueryObject
    */
    UmlClassItem.prototype.init = function(jQueryObject){
        if(jQueryObject){
            this.jQueryObject = jQueryObject;
        }else{
            Item.prototype.init.call(this, null);
            var contentObject = this.getContentObject();
            contentObject.addClass(configuration.umlClassContentClass);
            this.getContentTitleObject().addClass(configuration.umlClassContentTitleClass);
            contentObject.append($('<div class="'+configuration.umlAttributesClass+'" />'));
            contentObject.append($('<div class="'+configuration.umlMethodsClass+'" />'));
        }
    };
    
    /*
    *   Update the displayed methods
    */
    UmlClassItem.prototype.updateMethods = function(){
        var methodContainer = this.jQueryObject.find("."+configuration.umlMethodsClass);
        for(var i=0; i<this.methods.length; i++){
            if(this.methods[i]){
                methodContainer.append(
                    $('<div class="'+configuration.umlMethodClass+'" />').text(this.methods[i]));
            }
        }
    };
    
    /*
    *   Add a method to the Uml Class Item
    *
    *   @param method
    */
    UmlClassItem.prototype.addMethod = function(method){
        this.methods.push(method);
        this.updateMethods();
    };
    
    /*
    *   Update the displayed attributes
    */
    UmlClassItem.prototype.updateAttributes = function(){
        var attributeContainer = this.jQueryObject.find("."+configuration.umlAttributesClass);
        for(var i=0; i<this.attributes.length; i++){
            if(this.attributes[i]){
                attributeContainer.append(
                    $('<div class="'+configuration.umlAttributeClass+'" />').text(this.attributes[i]));
            }
        }
    };
    
    /*
    *   Add an attribute to the Uml Class Item
    *
    *   @param method
    */
    UmlClassItem.prototype.addAttribute = function(attribute){
        this.attributes.push(attribute);
        this.updateAttributes();
    }


    /*
    *   Uml Class Item Constructor
    *       extends Item
    */
    var PictureItem = function(id){
        Item.call(this, id);
        this.url = "";
    };

    PictureItem.prototype = new Item();

    /*
    *   Initialize the jQueryObject
    */
    PictureItem.prototype.init = function(jQueryObject){
        if(jQueryObject){
            this.jQueryObject = jQueryObject;
        }else{
            Item.prototype.init.call(this, null);
            this.getContentObject().append($('<img class="'+configuration.pictureContentClass+'" />'));
        }        
    };

    PictureItem.prototype.setSrc = function(src){
        this.getContentObject().find('.'+configuration.pictureContentClass).attr("src", src);
    }

    PictureItem.prototype.setAlt = function(alt){
        this.getContentObject().find('.'+configuration.pictureContentClass).attr("alt", alt);
    }

    
    /*
    *   Create a new post it
    */
    var createPostIt = function(id){
        var newPostIt = new PostItItem(id); 
        newPostIt.init();
        newPostIt.setTitle(configuration.postItTitle+" "+id);               
        newPostIt.setText($("<p>"+configuration.postItContent+"</p>").text());        
        return newPostIt;
    }; 

    /*
    *   Create a new uml class
    */
    var createUmlClass = function(id){
        var newUmlClassItem = new UmlClassItem(id); 
        newUmlClassItem.init();      
        newUmlClassItem.setTitle(configuration.umlTitle+" "+id);      
        return newUmlClassItem;
    }; 

    /*
    *   Create a new picture
    */    
    var createPicture = function(id){
        var newPictureItem = new PictureItem(id);
        newPictureItem.init();
        newPictureItem.setTitle(configuration.pictureTitle+" "+id);
        newPictureItem.setAlt(id);
        newPictureItem.setSrc(configuration.defaultPictureSrc);
        return newPictureItem;
    }
    
    
    var createItem = function(type, id) {
        if(type === configuration.umlClassType){
            return createUmlClass(id);
        }else if( type === configuration.postItType){
            return createPostIt(id);
        }else if(type === configuration.pictureType){
            return createPicture(id);
        }        
        return null;
    };
    
    return {
        createItem      :   createItem,
    };
    
})(Moka.itemFactoryConfiguration);   