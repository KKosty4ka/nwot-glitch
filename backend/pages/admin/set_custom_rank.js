var utils = require("../../utils/utils.js");
var checkURLParam = utils.checkURLParam;
var san_nbr = utils.san_nbr;

module.exports.GET = async function(req, write, server, ctx, params) {
	var path = ctx.path;
	var render = ctx.render;
	var user = ctx.user;

	var db = server.db;
	var callPage = server.callPage;
	var ranks_cache = server.ranks_cache;
	var createCSRF = server.createCSRF;

	if(!user.superuser) {
		return await callPage("404", null, req, write, server, ctx);
	}

	var username = checkURLParam("/administrator/set_custom_rank/:username", path).username;

	var user_edit = await db.get("SELECT * FROM auth_user WHERE username=? COLLATE NOCASE", username);
	if(!user_edit) {
		return await callPage("404", null, req, write, server, ctx);
	}

	var custom_ranks = [];
	
	var custom_count = ranks_cache.count;
	var custom_ids = ranks_cache.ids;
	for(var i = 0; i < custom_count; i++) {
		var level = i + 4;
		for(var x = 0; x < custom_ids.length; x++) {
			var cid = custom_ids[x];
			if(ranks_cache[cid].level == level) {
				custom_ranks.push({ level, name: ranks_cache[cid].name, id: cid });
				break;
			}
		}
	}

	var csrftoken = createCSRF(user.id.toString(), 0);

	var data = {
		user_edit,
		message: params.message,
		ranks: custom_ranks,
		current_rank: user_edit.id in ranks_cache.users ? ranks_cache.users[user_edit.id] : "none",
		csrftoken
	};

	write(render("administrator_set_custom_rank.html", data));
}

module.exports.POST = async function(req, write, server, ctx) {
	var post_data = ctx.post_data;
	var path = ctx.path;
	var user = ctx.user;

	var db = server.db;
	var callPage = server.callPage;
	var url = server.url;
	var ranks_cache = server.ranks_cache;
	var db_misc = server.db_misc;
	var checkCSRF = server.checkCSRF;

	if(!user.superuser) {
		return;
	}

	var csrftoken = post_data.csrfmiddlewaretoken;
	if(!checkCSRF(csrftoken, user.id.toString(), 0)) {
		return write("CSRF verification failed - please try again. This could be the result of leaving your tab open for too long.");
	}

	var username = checkURLParam("/administrator/set_custom_rank/:username", path).username;
	
	var user_edit = await db.get("SELECT * FROM auth_user WHERE username=? COLLATE NOCASE", username);
	if(!user_edit) {
		return;
	}

	var rank = san_nbr(post_data.rank);

	var ids = ranks_cache.ids;
	if(ids.indexOf(rank) == -1 && rank != -1) return;

	var rankName = "(No custom rank)";
	if(rank > -1) {
		rankName = ranks_cache[rank].name;
	}

	var user_rank_row = await db_misc.get("SELECT * FROM user_ranks WHERE userid=?", user_edit.id);
	if(user_rank_row) {
		if(rank > -1) {
			await db_misc.run("UPDATE user_ranks SET rank=? WHERE userid=?", [rank, user_edit.id]);
		} else {
			await db_misc.run("DELETE FROM user_ranks WHERE userid=?", user_edit.id);
		}
	} else {
		if(rank > -1) {
			await db_misc.run("INSERT INTO user_ranks VALUES(?, ?)", [user_edit.id, rank]);
		}
	}
	if(rank > -1) {
		ranks_cache.users[user_edit.id] = rank;
	} else {
		delete ranks_cache.users[user_edit.id];
	}

	return await callPage("admin/set_custom_rank", {
		message: "Successfully set " + user_edit.username + "'s rank to " + rankName
	}, req, write, server, ctx);
}