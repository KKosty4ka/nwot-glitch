var utils = require("../../utils/utils.js");
var checkDuplicateCookie = utils.checkDuplicateCookie;
var http_time = utils.http_time;

module.exports.GET = async function(req, write, server, ctx) {
	var cookies = ctx.cookies;
	var query_data = ctx.query_data;

	var db = server.db;
	
	var logoutReturn = query_data.return;

	if(cookies.sessionid) {
		await db.run("DELETE FROM auth_session WHERE session_key=?", cookies.sessionid);
	}

	write(null, null, {
		cookie: "sessionid=; expires=" + http_time(0) + "; path=/",
		redirect: "/home/"
	});
}