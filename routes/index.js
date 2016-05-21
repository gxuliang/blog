
/*
 * GET home page.
 */


 exports.index = function(req, res){
 	res.render('index', { 
 		title: '首页'
 	});
 };


 exports.reg = function(req, res) { 
 	res.render('reg', { 
 		title: '用户注册'
 	});
 };

 exports.login = function(req, res) { 
 	res.render('login', { 
 		title: '用户登入'
 	});
 };

/*
exports.posts = function(req, res) { 
 	res.render('posts', { 
 		title: '发布微博'
 	});
 };
 */

