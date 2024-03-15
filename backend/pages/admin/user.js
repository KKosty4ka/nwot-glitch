var utils = require("../../utils/utils.js");
var checkURLParam = utils.checkURLParam;

module.exports.GET = async function(req, write, server, ctx, params) {
	var path = ctx.path;
	var render = ctx.render;
	var user = ctx.user;

	var db = server.db;
	var callPage = server.callPage;
	var db_misc = server.db_misc;
	var createCSRF = server.createCSRF;

	if(!user.operator) {
		return await callPage("404", null, req, write, server, ctx);
	}

	var username = checkURLParam("/administrator/user/:username", path).username;
	
	var user_edit = await db.get("SELECT * FROM auth_user WHERE username=? COLLATE NOCASE", username);
	if(!user_edit) {
		return await callPage("404", null, req, write, server, ctx);
	}

	var csrftoken = createCSRF(user.id, 0);

	var data = {
		user_edit,
		message: params.message,
		csrftoken
	};

	write(render("administrator_user.html", data));
}

module.exports.POST = async function(req, write, server, ctx) {
	var post_data = ctx.post_data;
	var path = ctx.path;
	var user = ctx.user;

	var db = server.db;
	var db_edits = server.db_edits;
	var callPage = server.callPage;
	var url = server.url;
	var db_misc = server.db_misc;
	var checkCSRF = server.checkCSRF;

	if(!user.operator) {
		return;
	}

	var csrftoken = post_data.csrfmiddlewaretoken;
	if(!checkCSRF(csrftoken, user.id.toString(), 0)) {
		return write("CSRF verification failed - please try again. This could be the result of leaving your tab open for too long.");
	}

	var username = checkURLParam("/administrator/user/:username", path).username;

	var user_edit = await db.get("SELECT * FROM auth_user WHERE username=? COLLATE NOCASE", username);
	if(!user_edit) {
		return;
	}

	if(user_edit.id == user.id) {
		return await callPage("admin/user", {
			message: "You cannot set your own rank"
		}, req, write, server, ctx);
	}

	if(post_data.form == "rank") {
		var rank = -1;
		if(post_data.rank == "operator") rank = 3;
		if(post_data.rank == "superuser") rank = 2;
		if(post_data.rank == "staff") rank = 1;
		if(post_data.rank == "default") rank = 0;
		if(rank > -1) {
			await db.run("UPDATE auth_user SET level=? WHERE id=?", [rank, user_edit.id]);
			await db_edits.run("INSERT INTO edit VALUES(?, ?, ?, ?, ?, ?)",
				[user.id, 0, 0, 0, Date.now(), "@" + JSON.stringify({
					kind: "administrator_user",
					user_edit: {
						id: user_edit.id,
						username: user_edit.username
					},
					rank: rank
				})]);
		} else {
			return write("Invalid rank");
		}
		return await callPage("admin/user", {
			message: "Successfully set " + user_edit.username + "'s rank to " + ["Default", "Staff", "Superuser", "Operator"][rank]
		}, req, write, server, ctx);
	}

	write(null, null, {
		redirect: url.parse(req.url).pathname
	});
}