(function() {
	const chatElementId = ""; //= chatconfig.chatElementId; //attach to existing DOM element - id of element 
	const chatDynamicId = ""; //= chatconfig.chatDynamicId; //create button dynamically - id of DOM container
	const chatDynamicCorner = ""; //= chatconfig.chatDynamicCorner; //create button dynamically - topleft, topright, bottomleft, bottomright
  	let cpButtonLabel = ""; //= chatconfig.cpButtonLabel; //set the button message
	let cpButtonStyle = ""; //= chatconfig.cpButtonStyle; //custom style for button

	let cpButtonContainer;
  	const cpChatContainer = "cpchat-chatdivbig";
  	let chatFrameDiv;
	let chatActivated = false;
  	let chatClient;
	let formName;
	let formEmail;
	let formPhone;
	let formMessage;
	let appContainer;
	let channel;
	let pageUrl = window.location.href;
	let chatFrame = {};
	let chatParams;

	init();	

	function init() {
		//bring in all js files via js
		dynamicallyLoadScript("https://media.twiliocdn.com/sdk/js/common/v0.1/twilio-common.min.js");
		dynamicallyLoadScript("https://media.twiliocdn.com/sdk/js/chat/v1.0/twilio-chat.js");
		dynamicallyLoadScript("https://media.twiliocdn.com/sdk/js/frame-chat/v0.3/twilio-frame-chat.bundle.min.js");

		//set config file
		const chatJSONpath = '../client_chat/config.json';
		//load JSON
	  	loadJSON(function(response) {return chatParams = JSON.parse(response);
		 	}, chatJSONpath);

		//add styles
		let fileref = document.createElement("link");
		fileref.rel = "stylesheet";
		fileref.type = "text/css";
		fileref.href = "../chatstyles.css";
		document.head.appendChild(fileref);

		//set div holding the chat app
		if (chatElementId != "" ){
			// if chatElementId is set attach handler to that element
			appContainer = document.getElementById(chatElementId);
			cpButtonContainer = appContainer;
			attachChat();
			makeHandler(appContainer);
		}else if(chatDynamicId != "" ){
			//make button in user provided id
			appContainer = document.getElementById(chatDynamicId);
			makeButton(appContainer, false);
		}else if(chatDynamicCorner != ""){
			//make button with one of the corner classes
			makeButton(chatDynamicCorner, true);
		}else{
			//make button in bottomright by default
			makeButton("bottomright", true);
		}

	}

	function processChatParams () {
		chatParams["channel"]["windowControls"]["closeCallback"] = closeCallback;
		return chatParams;
	}

	function makeButton (option, isCorner) {
		//test for message setting
		if (cpButtonLabel == ""){
			cpButtonLabel = "Click to chat";
		}
		//button style
		if (cpButtonStyle == ""){
			cpButtonStyle = "cpchat-defaultButton";
		}

		//if button is a dynamic corner button
		if(isCorner === true){
			//create div that can be positioned anywhere
			let chatWrapper = document.createElement("div")
			chatWrapper.setAttribute("id", "cpchat-cpChatWrapper");
			document.body.appendChild(chatWrapper);
			appContainer = document.getElementById("cpchat-cpChatWrapper");

			//set class to corner
			cornerClass = "cpchat-" + option;
			chatWrapper.setAttribute("class", cornerClass);
		}else{
			//if button is dynamic with a set container
		}

		//make container for button
		const buttondiv = document.createElement("div")
		buttondiv.setAttribute("id", "cpchat-chatdivsmall");
		appContainer.appendChild(buttondiv);
		cpButtonContainer = "cpchat-chatdivsmall";

		//make button in id
		const chatButton = document.createElement("button");
		chatButton.setAttribute("class", cpButtonStyle);
		chatButton.innerHTML = cpButtonLabel;
		buttondiv.appendChild(chatButton);
		attachChat();
		makeHandler(chatButton);
	}

	function attachChat(){
		//make container for chat frame
		const chatdiv = document.createElement("div");
		chatdiv.setAttribute("id", cpChatContainer);
		appContainer.appendChild(chatdiv);

		chatFrameDiv = document.createElement("div");
		chatFrameDiv.setAttribute("id", "cpchat-chatContainer");
		chatdiv.appendChild(chatFrameDiv);
	}

	function makeHandler(chatButton) {
		// add event handler
		chatButton.addEventListener("click", function(){			
			document.getElementById(cpChatContainer).style.display= "block";
			if(chatElementId ==""){
				document.getElementById(cpButtonContainer).style.display= "none";
			}
			if(!chatActivated){
				initForm();
			}
		});
	}

	function dynamicallyLoadScript(url) {
		let script = document.createElement('script'); 
		script.src = url; 
		document.body.appendChild(script);
	}

	function loadJSON(callback, path) {   
    	let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    		xobj.open('GET', path, true); 
    		xobj.onreadystatechange = function () {
          	if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
				chatParams = callback(xobj.responseText);
          	}
    };
    xobj.send(null);  
 }

	function initForm() {
		loadForm();
		addFormEventListener();
		chatActivated = true;
		processChatParams();
	}

	function loadForm() {
		const form = document.createElement("div");
		form.setAttribute("id", "cpchat-formdiv");

		form.innerHTML = `<div id="cpchat-formheader"><span>Chat with one of our agents</span><div id="cpchat-downicon"></div></div><form id="cpchat-form">
			<label for="name">name<span id="cpchat-nameValidate"> (name is required)</span></label>
			<input type="text" name="name" id="cpchat-name" class="text" placeholder="name" required>
			<label for="email">email address (optional)</label>
			<input type="text" name="email" id="cpchat-email" class="text" placeholder="example@gmail.com">
			<label for="phone">phone number (optional)</label>'
			<input type="text" name="phone" id="cpchat-phone" class="text" placeholder="(XXX)XXX-XXXX">
			<label for="message">what can we help you with? (optional)</label>
			<textarea type="text" name="message" form="cpchat-form" id="cpchat-message" rows="3" class="text"></textarea>
			<input type="submit" value="START CHAT" id="cpchat-start">
			</form>`;
	chatFrameDiv.appendChild(form);
	}

	function addFormEventListener() {
		const downButton = document.getElementById("cpchat-downicon");
		downButton.addEventListener("click", function(event){
			event.preventDefault();
			closeframe();
		});
		const startButton = document.getElementById("cpchat-start");
		startButton.addEventListener("click", function(event){
			if (startButton.getAttribute("class") == "disabled"){
				event.preventDefault();
				event.stopPropagation();
			} else {
				formName = document.getElementById("cpchat-name").value;
				formEmail = document.getElementById("cpchat-email").value;
				formPhone = document.getElementById("cpchat-phone").value;
				formMessage = document.getElementById("cpchat-message").value;
				startButton.setAttribute("class","disabled");
				event.preventDefault();
				event.stopPropagation();
				if(validate()){
					getToken();
				}else{
					//insert message
					let valMessage = document.getElementById("cpchat-nameValidate");
					valMessage.setAttribute("class","show");
					//reset form
					enableButton();
				}
			} 
		});
	}
	
	function enableButton() {
		const startButton = document.getElementById("cpchat-start");
		startButton.removeAttribute("class:disabled");
		startButton.setAttribute("class","enabled");
	}
	function validate() {
		if(!!formName) {
			return true;
		}else{		
			return false;
		}
	}
	function channelMessage(message){
		const containerSpan = document.getElementById("cpchat-channelMessage");
		containerSpan.innerHTML = message;
	}
	function createMessageArea(){
		const containerSpan = document.getElementsByClassName("Twilio-ConnectionBar");
		let messageSpan = document.createElement("span");
		messageSpan.setAttribute("id", "cpchat-channelMessage");
		containerSpan[0].appendChild(messageSpan);
	}	

	function getToken() {
		let data = JSON.stringify({
			"friendlyName": "callPotential chat",
			"userURL": pageUrl,
			"email": formEmail
		});

		let request = new XMLHttpRequest();
		request.open('POST', '/twilio/clientchannel', true);
		//request.open('POST', 'http://qa-449-chat.callpotential.com/twilio/clientchannel', true);
		request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				resp = JSON.parse(request.response);
				token = resp.accessToken;
				channel = resp.channel;
				loadChat(token, channel);
			} else {
				console.log("error");
				enableButton();
			}
		};
		request.onerror = function() {
		};
		request.send(data);
	}

	function closeframe () {
			document.getElementById(cpChatContainer).style.display= "none";
			document.getElementById(cpButtonContainer).style.display= "block";
	}

	function closeCallback() {
		if(chatActivated){
			closeframe();
		}else{
			chatFrame.unloadChannelByContainer('#cpchat-chatContainer');
			closeframe();
		}
	}

	function loadChat(token, channel) {
		const channelSid = channel.sid;
		client = new Twilio.Chat.Client.create(token, {
		})
		.then(client => {
			client.on('channelJoined', channel => {
				loadFrame(client, channel);
				channelMessage("Please wait for an agent to join")
				//send initial message if there is one
				if(!!formMessage){
					channel.sendMessage(formMessage);
				}
			});
			client.on('channelRemoved', function() {
				channelMessage("Agent has closed the chat");
				chatActivated = false;
			});
			client.on('memberJoined', function(member) {
				channelMessage('You are chatting with ' + member.identity);
			});
			client.on('typingEnded', function(member) {
				channelMessage('');
			});
			return client.getChannelBySid(channelSid).catch(err => {
				return client.createChannel({
				uniqueName: "zzzzzz",
				friendlyName: "zzCallPotentialzz"
				});
			});
		})
		.then(channel => {
			return channel.join();
		})
		.catch(err => {
			console.error(err);
		});
	}

	function loadFrame(client, channel) {
		chatFrame = Twilio.Frame.createChat(client, chatParams);
		chatFrame.loadChannel('#cpchat-chatContainer', channel);
		createMessageArea();
	}
})();