const baseurl = "https://px1.tuyaeu.com/homeassistant/";
var proxyurl = "https://cors-anywhere.herokuapp.com/";

function login(username, password, region) {
	var to_return = {};
	var data = {
		"userName": username,
		"password": password,
		"countryCode": region,
		"bizType": "smart_life",
		"from": "tuya",
	}
	var headers = {
		"Content-Type": "application/x-www-form-urlencoded"
	}
	var url = baseurl + "auth.do";
	$.ajax({
		url: proxyurl+url,
		type: "POST",
		headers: headers,
		data: data,
		dataType: "json",
		async: false,
		success: function (json) {
			console.log(json);
			if ("access_token" in json) {
				to_return["access_token"] = json["access_token"];
				setCookie("access_token", json["access_token"], json["expires_in"]/3600);
				to_return["logged_in"] = true;
			}
		}
	});
	return to_return;
}

function get_device_list(user_info) {
	to_return = {};
	var url = baseurl + "skill";
	var headers = {
		"Content-Type": "application/json"
	}
	data = {
		"header": {
			"name": "Discovery",
			"namespace": "discovery",
			"payloadVersion": 1,
		},
		"payload": {
			"accessToken": user_info["access_token"],
		},
	}
	$.ajax({
		url: proxyurl+url,
		type: "POST",
		headers: headers,
		data: JSON.stringify(data),
		dataType: "json",
		async: false,
		success: function (json) {
			if ("payload" in json && "devices" in json["payload"]) {
				to_return["devices"] = json["payload"]["devices"];
				to_return["success"] = true;
			}
		}
	});
	return to_return
}

function switch_device(device, user_info, new_state) {
	to_return = {};
	var url = baseurl + "skill";
	var headers = {
		"Content-Type": "application/json"
	}
	var data = {
		"header": {
			"name": "turnOnOff",
			"namespace": "control",
			"payloadVersion": 1
		},
		"payload": {
			"accessToken": user_info["access_token"],
			"devId": device["id"],
			"value": new_state
		}
	}
	$.ajax({
		url: proxyurl+url,
		type: "POST",
		headers: headers,
		data: JSON.stringify(data),
		dataType: "json",
		async: false,
		success: function (json) {
			console.log(json);
		}
	});
	return to_return
}

function do_login() {
	var login_div = document.getElementById("login");
	login_div.classList.add("hidden");
	var loader_div = document.getElementById("loader");
	loader_div.classList.remove("hidden");
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	var region = document.getElementById("region").value;
	setTimeout(function(){
		user_info = login(username, password, region);
		if (user_info["logged_in"] == true) {
			device_list = get_device_list(user_info);
			user_info["devices"] = device_list["devices"]
			on_login(user_info);
		} else {
			on_logout();
			document.getElementById("loginfailed").innerHTML = "Login failed";
		}
	}, 100);
}

function check_login(user_info) {
	if (! user_info["access_token"] == "") {
		console.log("Getting devices");
		device_list = get_device_list(user_info);
		return device_list;
	} else {
		console.log("No access_token");
		return false;
	}
}

function on_login(user_info) {
	var login_div = document.getElementById("login");
	login_div.classList.add("hidden");
	var switches = document.getElementById("switches");
	switches.classList.remove("hidden");
	var loader_div = document.getElementById("loader");
	loader_div.classList.add("hidden");
	update_devices(user_info);
}

function update_devices(user_info, force_update) {
	if (force_update == true) {
		device_list = get_device_list(user_info);
		user_info["devices"] = device_list["devices"];
	}
	var devices = user_info["devices"];
	var switches = document.getElementById("switches");
	switches.innerHTML = "";
	for (device in devices) {
		var name = devices[device]["name"];
		var state = devices[device]["data"]["state"];
		switches.innerHTML += "<br />"+name+": ";
		if (state == false) {
			switches.innerHTML += '<a href="#" class="ui-btn ui-btn-b ui-btn-inline ui-icon-power ui-btn-icon-left" onclick="toggle('+device+');">Off</a>';
		} else {
			switches.innerHTML += '<a href="#" class="ui-btn ui-btn-inline ui-icon-power ui-btn-icon-left" onclick="toggle('+device+');">On</a>';
		}
	}
	setTimeout(update_devices, 10000, user_info, true);
}

function toggle(device_no) {
	var device = user_info["devices"][device_no];
	var state = device["data"]["state"];
	if (state == false) {
		new_state = 1;
	} else {
		new_state = 0;
	}
	switch_device(device, user_info, new_state);
	update_devices(user_info, true);
}

function on_logout() {
	var switches = document.getElementById("switches");
	switches.classList.add("hidden");
	var login_div = document.getElementById("login");
	login_div.classList.remove("hidden");
	var loader_div = document.getElementById("loader");
	loader_div.classList.add("hidden");
}

