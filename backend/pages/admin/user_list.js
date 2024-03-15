var utils = require("../../utils/utils.js");
var create_date = utils.create_date;

module.exports.GET = async function(req, write, server, ctx, params) {
	var render = ctx.render;
	var user = ctx.user;

	var db = server.db;
	var callPage = server.callPage;
	var db_misc = server.db_misc;

	if(!user.operator) {
		return await callPage("404", null, req, write, server, ctx);
	}
	
	var users = await db.all("SELECT * FROM auth_user");

	for(var i = 0; i < users.length; i++) {
		users[i].last_login = create_date(users[i].last_login);
		users[i].date_joined = create_date(users[i].date_joined);
	}

	var data = {
		users
	};

	write(render("administrator_user_list.html", data));
}