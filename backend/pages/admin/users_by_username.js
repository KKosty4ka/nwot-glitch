var utils = require("../../utils/utils.js");
var checkURLParam = utils.checkURLParam;

module.exports.GET = async function(req, write, server, ctx, params) {
	var path = ctx.path;
	var render = ctx.render;
	var user = ctx.user;

	var db = server.db;
	var callPage = server.callPage;
	var db_misc = server.db_misc;

	if(!user.superuser) {
		return await callPage("404", null, req, write, server, ctx);
	}

	var username = checkURLParam("/administrator/users/by_username/:username", path).username;
	
	var user_info = await db.get("SELECT * FROM auth_user WHERE username=? COLLATE NOCASE", username);
	if(!user_info) {
		return "This user does not exist.";
	}

	var data = {
		user_info,
		date_joined: new Date(user_info.date_joined).toString(),
		last_login: new Date(user_info.last_login).toString(),
		worlds_owned: (await db.get("SELECT count(*) AS cnt FROM world WHERE owner_id=?", [user_info.id])).cnt,
		level: user_info.level,
		is_active: !!user_info.is_active,
		display_name: user_info.display_name
	};

	write(render("administrator_users_template.html", data));
}