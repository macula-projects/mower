var timeZoneOffset = new Date().getTimezoneOffset();

var expireDate = new Date();
expireDate.setDate(expireDate.getDate() + 365);

document.cookie = "timezoneOffset=" + escape(timeZoneOffset * (-1)) + ";expires=" + expireDate.toGMTString();
