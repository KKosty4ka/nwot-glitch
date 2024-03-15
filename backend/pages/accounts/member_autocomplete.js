function escape_control(str) {
	str += "";
	str = str.replace(/\\/g, "\\\\");
	str = str.replace(/%/g, "\\%");
	str = str.replace(/_/g, "\\_");
	return str;
}

module.exports.GET = async function(req, write, server, ctx) {
	var query_data = ctx.query_data;
	var user = ctx.user;

	var db = server.db;

	if(!user.authenticated) return write(null, 403);

	var input = query_data.q;

	if(!input) input = "";
	input += "";
	input = input.trim();
	if(!input) return write("");
	if(input.length < 4) return write("");

	var list = await db.all("SELECT username FROM auth_user WHERE username LIKE ? || '%' ESCAPE '\\' ORDER BY username LIMIT 10", escape_control(input));

	var users = [];
	for(var i = 0; i < list.length; i++){
		users.push(list[i].username);
	}
	write(users.join("\n"));
}